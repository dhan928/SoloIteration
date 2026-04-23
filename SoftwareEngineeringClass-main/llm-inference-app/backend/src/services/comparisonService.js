const supabase = require('../database/supabaseClient');
const { v4: uuidv4 } = require('uuid');
const { validateComparisonInput } = require('../utils/comparisonValidators');
const { generateResponse } = require('./llmInferenceService');

class ComparisonService {
  /**
   * Create a comparison request for multiple models
   */
  static async createComparison(userId, prompt, models, temperature = 0.7, maxTokens = 500) {
    try {
      // Validate input
      const validation = validateComparisonInput(prompt, models);
      if (!validation.isValid) {
        const error = new Error(validation.errors.join('; '));
        error.status = 400;
        throw error;
      }

      const comparisonId = uuidv4();
      
      // Create parent comparison record
      const comparisonData = {
        comparison_id: comparisonId,
        user_id: userId,
        prompt,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const comparison = await supabase.insertComparison(comparisonData);
      
      if (!comparison || comparison.length === 0) {
        throw new Error('Failed to create comparison record');
      }

      // Create child response records for each model
      const responseRecords = models.map(model => ({
        comparison_response_id: uuidv4(),
        comparison_id: comparisonId,
        model,
        response: null,
        status: 'pending',
        execution_time_ms: null,
        error_message: null,
        created_at: new Date().toISOString()
      }));

      await supabase.insertComparisonResponses(responseRecords);

      return {
        comparisonId,
        prompt,
        models,
        status: 'pending',
        createdAt: comparisonData.created_at,
        results: responseRecords.map((r) => ({
          model: r.model,
          status: r.status,
          response: null,
          executionTimeMs: null,
          errorMessage: null
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Run stub (or future real) inference for each child row in parallel.
   * Partial failures are persisted per model; the parent is marked completed when all finish.
   */
  static async runInferenceForComparison(comparisonId, prompt, temperature = 0.7, maxTokens = 500) {
    const rows = await supabase.queryComparisonResponses(`comparison_id=eq.${comparisonId}`);
    const list = rows || [];

    await Promise.all(
      list.map(async (row) => {
        const started = Date.now();
        try {
          const text = await generateResponse(row.model, prompt, { temperature, maxTokens });
          const executionTimeMs = Date.now() - started;
          await supabase.updateComparisonResponse(row.comparison_response_id, {
            response: text,
            execution_time_ms: executionTimeMs,
            status: 'completed'
          });
        } catch (e) {
          const executionTimeMs = Date.now() - started;
          await supabase.updateComparisonResponse(row.comparison_response_id, {
            status: 'failed',
            error_message: e.message || 'Inference failed',
            execution_time_ms: executionTimeMs
          });
        }
      })
    );

    const parentRows = await supabase.queryComparisons(`comparison_id=eq.${comparisonId}`);
    if (parentRows && parentRows.length > 0) {
      await supabase.updateComparison(comparisonId, { status: 'completed' });
    }
  }

  /**
   * Get a comparison by ID with all child responses
   */
  static async getComparison(comparisonId, userId) {
    try {
      // Get comparison
      const comparisons = await supabase.queryComparisons(
        `comparison_id=eq.${comparisonId}&user_id=eq.${userId}`
      );

      if (!comparisons || comparisons.length === 0) {
        const err = new Error('Comparison not found');
        err.status = 404;
        throw err;
      }

      const comparison = comparisons[0];

      // Get comparison responses
      const responses = await supabase.queryComparisonResponses(
        `comparison_id=eq.${comparisonId}`
      );

      return {
        comparisonId: comparison.comparison_id,
        prompt: comparison.prompt,
        status: comparison.status,
        createdAt: comparison.created_at,
        results: (responses || []).map(r => ({
          model: r.model,
          response: r.response,
          status: r.status,
          executionTimeMs: r.execution_time_ms,
          errorMessage: r.error_message
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's comparison history
   */
  static async getComparisonHistory(userId, limit = 50, offset = 0) {
    try {
      const comparisons = await supabase.queryComparisons(
        `user_id=eq.${userId}`,
        {
          limit,
          offset,
          order: 'created_at.desc'
        }
      );

      // Get total count
      const allComparisons = await supabase.queryComparisons(`user_id=eq.${userId}`);
      const total = allComparisons ? allComparisons.length : 0;

      return {
        data: (comparisons || []).map(comp => ({
          comparisonId: comp.comparison_id,
          prompt: comp.prompt,
          status: comp.status,
          createdAt: comp.created_at
        })),
        total,
        limit,
        offset
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a comparison and all its child responses
   */
  static async deleteComparison(comparisonId, userId) {
    try {
      // First check if comparison exists and belongs to user
      const comparisons = await supabase.queryComparisons(
        `comparison_id=eq.${comparisonId}&user_id=eq.${userId}`
      );

      if (!comparisons || comparisons.length === 0) {
        const err = new Error('Comparison not found');
        err.status = 404;
        throw err;
      }

      // Delete child responses first (cascade will handle this, but explicit for clarity)
      await supabase.deleteComparisonResponsesByComparison(comparisonId);

      // Delete the comparison
      await supabase.deleteComparison(comparisonId);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a comparison response (called when model finishes inference)
   */
  static async updateComparisonResponse(comparisonResponseId, response, executionTimeMs) {
    try {
      await supabase.updateComparisonResponse(comparisonResponseId, {
        response,
        execution_time_ms: executionTimeMs,
        status: 'completed'
      });

      return { comparisonResponseId, status: 'completed' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a comparison response with error
   */
  static async updateComparisonResponseError(comparisonResponseId, errorMessage) {
    try {
      await supabase.updateComparisonResponse(comparisonResponseId, {
        status: 'failed',
        error_message: errorMessage,
        execution_time_ms: null
      });

      return { comparisonResponseId, status: 'failed', errorMessage };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Normalize comparison for dashboard rendering
   */
  static normalizeForDashboard(comparison) {
    return {
      comparisonId: comparison.comparisonId,
      prompt: comparison.prompt,
      status: comparison.status,
      createdAt: comparison.createdAt,
      results: (comparison.results || []).map((r) => ({
        model: r.model,
        status: r.status,
        response: r.response ?? null,
        executionTimeMs: r.executionTimeMs ?? null,
        errorMessage: r.errorMessage ?? null
      }))
    };
  }
}

module.exports = ComparisonService;
