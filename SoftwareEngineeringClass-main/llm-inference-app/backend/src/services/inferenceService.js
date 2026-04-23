const supabase = require('../database/supabaseClient');
const { v4: uuidv4 } = require('uuid');

class InferenceService {
  /**
   * Submit an inference request
   */
  static async submitInference(userId, prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500) {
    try {
      const inferenceId = uuidv4();
      const newInference = await supabase.insertInference({
        inference_id: inferenceId,
        user_id: userId,
        prompt,
        model,
        temperature,
        max_tokens: maxTokens,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      const inference = newInference[0];
      return {
        inferenceId: inference.inference_id,
        prompt: inference.prompt,
        model: inference.model,
        status: inference.status,
        createdAt: inference.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get inference by ID
   */
  static async getInference(inferenceId, userId) {
    try {
      const inferences = await supabase.queryInferences(
        `inference_id=eq.${inferenceId}&user_id=eq.${userId}`
      );

      if (!inferences || inferences.length === 0) {
        throw new Error('Inference not found');
      }

      const inf = inferences[0];
      return {
        inferenceId: inf.inference_id,
        prompt: inf.prompt,
        response: inf.response,
        model: inf.model,
        status: inf.status,
        temperature: inf.temperature,
        maxTokens: inf.max_tokens,
        executionTimeMs: inf.execution_time_ms,
        errorMessage: inf.error_message,
        createdAt: inf.created_at,
        completedAt: inf.completed_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's inference history
   */
  static async getInferenceHistory(userId, limit = 50, offset = 0) {
    try {
      const inferences = await supabase.queryInferences(
        `user_id=eq.${userId}`,
        {
          limit,
          offset,
          order: 'created_at.desc'
        }
      );

      // Get total count
      const allInferences = await supabase.queryInferences(`user_id=eq.${userId}`);
      const total = allInferences ? allInferences.length : 0;

      return {
        data: (inferences || []).map(inf => ({
          inferenceId: inf.inference_id,
          prompt: inf.prompt,
          response: inf.response,
          model: inf.model,
          status: inf.status,
          createdAt: inf.created_at,
          completedAt: inf.completed_at
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
   * Delete inference record
   */
  static async deleteInference(inferenceId, userId) {
    try {
      // First check if inference exists and belongs to user
      const inferences = await supabase.queryInferences(
        `inference_id=eq.${inferenceId}&user_id=eq.${userId}`
      );

      if (!inferences || inferences.length === 0) {
        throw new Error('Inference not found');
      }

      await supabase.deleteInference(inferenceId);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update inference with response (for when LLM service completes)
   */
  static async updateInferenceResponse(inferenceId, response, executionTimeMs) {
    try {
      await supabase.updateInference(inferenceId, {
        response,
        execution_time_ms: executionTimeMs,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      return { inferenceId, status: 'completed' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InferenceService;
