/**
 * Stub LLM provider used for demos and tests when no external API is configured.
 * Simulates latency and deterministic success/failure per model id.
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} model
 * @param {string} prompt
 * @param {{ temperature?: number, maxTokens?: number }} [_options]
 * @returns {Promise<string>}
 */
async function generateResponse(model, prompt, _options = {}) {
  await delay(15);
  if (model === 'local-small') {
    const err = new Error('Model unavailable');
    err.code = 'MODEL_UNAVAILABLE';
    throw err;
  }
  const text = (prompt || '').trim();
  const snippet = text.length > 240 ? `${text.slice(0, 240)}…` : text;
  return `[${model}] ${snippet}`;
}

module.exports = {
  generateResponse
};
