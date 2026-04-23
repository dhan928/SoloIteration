const { validationResult } = require('express-validator');
const ComparisonService = require('../services/comparisonService');

class ComparisonController {
  /**
   * Submit comparison request with multiple models
   */
  static async submitComparison(req, res) {
    try {
      const userId = req.user.userId;
      const { prompt, models, temperature = 0.7, maxTokens = 500 } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      const comparison = await ComparisonService.createComparison(
        userId,
        prompt,
        models,
        temperature,
        maxTokens
      );

      return res.status(201).json({
        success: true,
        message: 'Comparison request submitted',
        data: ComparisonService.normalizeForDashboard(comparison)
      });
    } catch (error) {
      console.error('Submit comparison error:', error);

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: { code: 'VALIDATION_ERROR' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'SUBMIT_COMPARISON_ERROR' }
      });
    }
  }

  /**
   * Get comparison result with all responses
   */
  static async getComparison(req, res) {
    try {
      const userId = req.user.userId;
      const { comparisonId } = req.params;

      const comparison = await ComparisonService.getComparison(comparisonId, userId);

      return res.status(200).json({
        success: true,
        message: 'Comparison retrieved successfully',
        data: ComparisonService.normalizeForDashboard(comparison)
      });
    } catch (error) {
      console.error('Get comparison error:', error);

      if (error.message === 'Comparison not found') {
        return res.status(404).json({
          success: false,
          message: 'Comparison not found',
          error: { code: 'COMPARISON_NOT_FOUND' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'GET_COMPARISON_ERROR' }
      });
    }
  }

  /**
   * Get comparison history
   */
  static async getComparisonHistory(req, res) {
    try {
      const userId = req.user.userId;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;

      const history = await ComparisonService.getComparisonHistory(userId, limit, offset);

      return res.status(200).json({
        success: true,
        message: 'Comparison history retrieved successfully',
        data: history.data,
        pagination: {
          total: history.total,
          limit: history.limit,
          offset: history.offset
        }
      });
    } catch (error) {
      console.error('Get comparison history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'GET_COMPARISON_HISTORY_ERROR' }
      });
    }
  }

  /**
   * Delete comparison
   */
  static async deleteComparison(req, res) {
    try {
      const userId = req.user.userId;
      const { comparisonId } = req.params;

      await ComparisonService.deleteComparison(comparisonId, userId);

      return res.status(200).json({
        success: true,
        message: 'Comparison deleted successfully'
      });
    } catch (error) {
      console.error('Delete comparison error:', error);

      if (error.message === 'Comparison not found') {
        return res.status(404).json({
          success: false,
          message: 'Comparison not found',
          error: { code: 'COMPARISON_NOT_FOUND' }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'DELETE_COMPARISON_ERROR' }
      });
    }
  }
}

module.exports = ComparisonController;
