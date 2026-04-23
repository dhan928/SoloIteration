const config = require('../config/config');
const openRouterClient = require('./openRouterClient');
const ollamaClient = require('./ollamaClient');
const stub = require('./llmStubService');

/**
 * Map dashboard model ids to OpenRouter model slugs (see https://openrouter.ai/models).
 */
function openRouterSlugForUiModel(uiModel) {
  const map = config.openrouter.modelSlugs;
  const slug = map[uiModel];
  if (!slug) {
    throw new Error(`No OpenRouter model slug configured for: ${uiModel}`);
  }
  return slug;
}

/**
 * True when this UI model should be sent to Ollama (local Llama, etc.).
 */
function useOllama(uiModel) {
  return uiModel === 'local-small';
}

/**
 * True when this UI model should be sent to OpenRouter (when API key is set).
 */
function useOpenRouter(uiModel) {
  return !useOllama(uiModel);
}

/**
 * Generate one answer for a comparison row: Ollama for local-small (if enabled),
 * OpenRouter for cloud ids (if key set), otherwise stub.
 *
 * @param {string} uiModel - e.g. gpt-4, claude-v1, local-small
 * @param {string} prompt
 * @param {{ temperature?: number, maxTokens?: number }} options
 * @returns {Promise<string>}
 */
async function generateResponse(uiModel, prompt, options = {}) {
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 500;

  if (useOllama(uiModel)) {
    if (config.ollama.baseUrl) {
      const ollamaModel = config.ollama.model;
      return ollamaClient.chat(ollamaModel, prompt, { temperature, maxTokens });
    }
    return stub.generateResponse(uiModel, prompt, options);
  }

  if (useOpenRouter(uiModel) && config.openrouter.apiKey) {
    const slug = openRouterSlugForUiModel(uiModel);
    return openRouterClient.chatCompletion(slug, prompt, { temperature, maxTokens });
  }

  return stub.generateResponse(uiModel, prompt, options);
}

module.exports = {
  generateResponse,
  openRouterSlugForUiModel,
  useOllama,
  useOpenRouter
};
