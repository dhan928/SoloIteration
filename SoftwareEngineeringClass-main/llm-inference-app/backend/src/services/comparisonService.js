const { v4: uuidv4 } = require('uuid');
const db = require('../database/sqliteClient');
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
      const createdAt = new Date().toISOString();
      await db.createComparison({
        recordId: comparisonId,
        userId,
        prompt,
        models,
        createdAt
      });

      return {
        comparisonId,
        prompt,
        models,
        status: 'pending',
        createdAt,
        results: models.map((model) => ({
          model,
          status: 'pending',
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
  static async runInferenceForComparison(userId, comparisonId, prompt, temperature = 0.7, maxTokens = 500) {
    const record = db.normalizeRecord(await db.findRecordById(comparisonId, userId));
    const models = record ? record.selectedModels : [];
    const results = [];

    await Promise.all(
      models.map(async (model) => {
        const started = Date.now();
        try {
          const text = await generateResponse(model, prompt, { temperature, maxTokens });
          results.push({
            model,
            response: text,
            status: 'completed',
            executionTimeMs: Date.now() - started,
            errorMessage: null
          });
        } catch (e) {
          results.push({
            model,
            response: null,
            status: 'failed',
            executionTimeMs: Date.now() - started,
            errorMessage: e.message || 'Inference failed'
          });
        }
      })
    );
    await db.updateComparisonResults(
      comparisonId,
      userId,
      results,
      'completed',
      new Date().toISOString()
    );
  }

  /**
   * Get a comparison by ID with all child responses
   */
  static async getComparison(comparisonId, userId) {
    try {
      // Get comparison
      const comparison = db.normalizeRecord(await db.findRecordById(comparisonId, userId));
      if (!comparison || comparison.mode !== 'compare') {
        const err = new Error('Comparison not found');
        err.status = 404;
        throw err;
      }

      return {
        comparisonId: comparison.recordId,
        prompt: comparison.prompt,
        status: comparison.status,
        createdAt: comparison.createdAt,
        results: comparison.results || []
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
      const comparisons = (await db.listComparisons(userId, limit, offset)).map((row) =>
        db.normalizeRecord(row)
      );
      const total = await db.countComparisons(userId);

      return {
        data: comparisons.map((comp) => ({
          comparisonId: comp.recordId,
          prompt: comp.prompt,
          status: comp.status,
          createdAt: comp.createdAt
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
      const comparison = await db.findRecordById(comparisonId, userId);
      if (!comparison) {
        const err = new Error('Comparison not found');
        err.status = 404;
        throw err;
      }

      await db.deleteRecord(comparisonId, userId);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a comparison response (called when model finishes inference)
   */
  static async updateComparisonResponse(comparisonResponseId, response, executionTimeMs) {
    return { comparisonResponseId, response, executionTimeMs, status: 'completed' };
  }

  /**
   * Update a comparison response with error
   */
  static async updateComparisonResponseError(comparisonResponseId, errorMessage) {
    return { comparisonResponseId, status: 'failed', errorMessage };
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
