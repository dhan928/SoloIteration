const { v4: uuidv4 } = require('uuid');
const db = require('../database/sqliteClient');
const { generateResponse } = require('./llmInferenceService');

class InferenceService {
  /**
   * Submit an inference request
   */
  static async submitInference(userId, prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500) {
    try {
      const inferenceId = uuidv4();
      const createdAt = new Date().toISOString();
      await db.createSingleInference({
        recordId: inferenceId,
        userId,
        prompt,
        model,
        createdAt
      });

      setImmediate(async () => {
        const started = Date.now();
        try {
          const response = await generateResponse(model, prompt, { temperature, maxTokens });
          await db.updateSingleInferenceResult(
            inferenceId,
            userId,
            {
              model,
              response,
              status: 'completed',
              executionTimeMs: Date.now() - started,
              errorMessage: null,
              temperature,
              maxTokens
            },
            'completed',
            new Date().toISOString()
          );
        } catch (error) {
          await db.updateSingleInferenceResult(
            inferenceId,
            userId,
            {
              model,
              response: null,
              status: 'error',
              executionTimeMs: Date.now() - started,
              errorMessage: error.message || 'Inference failed',
              temperature,
              maxTokens
            },
            'error',
            new Date().toISOString()
          );
        }
      });

      return {
        inferenceId,
        prompt,
        model,
        status: 'pending',
        createdAt
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
      const record = db.normalizeRecord(await db.findRecordById(inferenceId, userId));
      if (!record || record.mode !== 'single') {
        throw new Error('Inference not found');
      }

      const result = record.results[0] || {};
      return {
        inferenceId: record.recordId,
        prompt: record.prompt,
        response: result.response ?? null,
        model: result.model || record.selectedModels[0] || null,
        status: result.status || record.status,
        temperature: result.temperature ?? 0.7,
        maxTokens: result.maxTokens ?? 500,
        executionTimeMs: result.executionTimeMs ?? null,
        errorMessage: result.errorMessage ?? null,
        createdAt: record.createdAt,
        completedAt: record.completedAt
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
      const records = (await db.listSingleInferences(userId, limit, offset)).map((row) =>
        db.normalizeRecord(row)
      );
      const total = await db.countSingleInferences(userId);

      return {
        data: records.map((record) => {
          const result = record.results[0] || {};
          return {
            inferenceId: record.recordId,
            prompt: record.prompt,
            response: result.response ?? null,
            model: result.model || record.selectedModels[0] || null,
            status: result.status || record.status,
            createdAt: record.createdAt,
            completedAt: record.completedAt
          };
        }),
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
      const record = await db.findRecordById(inferenceId, userId);
      if (!record) {
        throw new Error('Inference not found');
      }

      await db.deleteRecord(inferenceId, userId);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update inference with response (for when LLM service completes)
   */
  static async updateInferenceResponse(inferenceId, response, executionTimeMs) {
    return { inferenceId, response, executionTimeMs };
  }
}

module.exports = InferenceService;
