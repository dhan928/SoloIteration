const { validationResult } = require('express-validator');
const InferenceService = require('../services/inferenceService');

class InferenceController {
  /**
   * Submit inference request
   */
  static async submitInference(req, res) {
    try {
      const userId = req.user.userId;
      const { prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500 } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      const inference = await InferenceService.submitInference(userId, prompt, model, temperature, maxTokens);

      return res.status(201).json({
        success: true,
        message: 'Inference request submitted',
        data: inference
      });
    } catch (error) {
      console.error('Submit inference error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'SUBMIT_INFERENCE_ERROR' }
      });
    }
  }

  /**
   * Get inference result
   */
  static async getInference(req, res) {
    try {
      const userId = req.user.userId;
      const { inferenceId } = req.params;

      const inference = await InferenceService.getInference(inferenceId, userId);

      return res.status(200).json({
        success: true,
        message: 'Inference retrieved successfully',
        data: inference
      });
    } catch (error) {
      if (error.message === 'Inference not found') {
        return res.status(404).json({
          success: false,
          message: 'Inference not found',
          error: { code: 'INFERENCE_NOT_FOUND' }
        });
      }

      console.error('Get inference error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'GET_INFERENCE_ERROR' }
      });
    }
  }

  /**
   * Get inference history
   */
  static async getHistory(req, res) {
    try {
      const userId = req.user.userId;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;

      const history = await InferenceService.getInferenceHistory(userId, limit, offset);

      return res.status(200).json({
        success: true,
        message: 'History retrieved successfully',
        data: history.data,
        pagination: {
          total: history.total,
          limit: history.limit,
          offset: history.offset
        }
      });
    } catch (error) {
      console.error('Get history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'GET_HISTORY_ERROR' }
      });
    }
  }

  /**
   * Delete inference
   */
  static async deleteInference(req, res) {
    try {
      const userId = req.user.userId;
      const { inferenceId } = req.params;

      await InferenceService.deleteInference(inferenceId, userId);

      return res.status(200).json({
        success: true,
        message: 'Inference deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Inference not found') {
        return res.status(404).json({
          success: false,
          message: 'Inference not found',
          error: { code: 'INFERENCE_NOT_FOUND' }
        });
      }

      console.error('Delete inference error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'DELETE_INFERENCE_ERROR' }
      });
    }
  }
}

module.exports = InferenceController;
