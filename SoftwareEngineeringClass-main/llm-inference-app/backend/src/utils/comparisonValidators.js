/**
 * Supported LLM models
 */
const SUPPORTED_MODELS = [
  'gpt-3.5-turbo',
  'gpt-4',
  'claude-v1',
  'local-small'
];

/**
 * Validate a single model ID
 */
function isValidModel(model) {
  return SUPPORTED_MODELS.includes(model);
}

/**
 * Validate prompt for comparison
 */
function isValidPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return false;
  }
  return prompt.trim().length >= 5;
}

/**
 * Validate models array for comparison
 * - Must have at least 2 models
 * - No duplicates
 * - All must be supported
 */
function validateModels(models) {
  const errors = [];

  if (!Array.isArray(models)) {
    errors.push('Models must be an array');
    return { isValid: false, errors };
  }

  if (models.length < 2) {
    errors.push('At least 2 models must be selected');
  }

  // Check for duplicates
  const uniqueModels = new Set(models);
  if (uniqueModels.size !== models.length) {
    errors.push('Duplicate models are not allowed');
  }

  // Check if all models are supported
  const unsupportedModels = models.filter(m => !isValidModel(m));
  if (unsupportedModels.length > 0) {
    errors.push(`Unsupported models: ${unsupportedModels.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate comparison request input
 */
function validateComparisonInput(prompt, models) {
  const errors = [];

  // Validate prompt
  if (!isValidPrompt(prompt)) {
    errors.push('Prompt must be at least 5 characters');
  }

  // Validate models
  const modelsValidation = validateModels(models);
  if (!modelsValidation.isValid) {
    errors.push(...modelsValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  SUPPORTED_MODELS,
  isValidModel,
  isValidPrompt,
  validateModels,
  validateComparisonInput
};
