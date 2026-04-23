const express = require('express');
const { body } = require('express-validator');
const InferenceController = require('../controllers/inferenceController');
const ComparisonController = require('../controllers/comparisonController');
const handleValidationErrors = require('../middleware/errorHandler');
const { SUPPORTED_MODELS } = require('../utils/comparisonValidators');

const router = express.Router();

// ===== Comparison Endpoints =====

// Submit comparison request (multiple models)
router.post(
  '/compare',
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 5 })
      .withMessage('Prompt must be at least 5 characters'),
    body('models')
      .isArray({ min: 2 })
      .withMessage('At least 2 models must be selected'),
    body('models.*')
      .isIn(SUPPORTED_MODELS)
      .withMessage('Invalid model'),
    body('temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('maxTokens')
      .optional()
      .isInt({ min: 1, max: 2000 })
      .withMessage('Max tokens must be between 1 and 2000')
  ],
  handleValidationErrors,
  ComparisonController.submitComparison
);

// Get comparison history
router.get('/comparisons', ComparisonController.getComparisonHistory);

// Get specific comparison
router.get('/comparisons/:comparisonId', ComparisonController.getComparison);

// Delete comparison
router.delete('/comparisons/:comparisonId', ComparisonController.deleteComparison);

// ===== Single Inference Endpoints =====

// Submit single inference request
router.post(
  '/submit',
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 5 })
      .withMessage('Prompt must be at least 5 characters'),
    body('model')
      .optional()
      .isIn(['gpt-3.5-turbo', 'gpt-4', 'claude-v1'])
      .withMessage('Invalid model'),
    body('temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('maxTokens')
      .optional()
      .isInt({ min: 1, max: 2000 })
      .withMessage('Max tokens must be between 1 and 2000')
  ],
  handleValidationErrors,
  InferenceController.submitInference
);

// Get inference result
router.get('/:inferenceId', InferenceController.getInference);

// Get inference history (fallback for /inference without params)
router.get('/', InferenceController.getHistory);

// Delete inference
router.delete('/:inferenceId', InferenceController.deleteInference);

module.exports = router;
