const config = require('../config/config');

/**
 * OpenRouter chat completion (OpenAI-compatible API).
 * @see https://openrouter.ai/docs
 */
async function chatCompletion(openRouterModelSlug, prompt, { temperature = 0.7, maxTokens = 500 } = {}) {
  const apiKey = config.openrouter.apiKey;
  if (!apiKey) {
    const err = new Error('OpenRouter API key not configured (set OPENROUTER_API_KEY)');
    err.code = 'OPENROUTER_NOT_CONFIGURED';
    throw err;
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.httpReferer,
      'X-Title': config.openrouter.appTitle
    },
    body: JSON.stringify({
      model: openRouterModelSlug,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    })
  });

  const raw = await res.text();
  if (!res.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw);
      message = j.error?.message || j.message || raw;
    } catch (_) {
      /* keep raw */
    }
    const err = new Error(message || `OpenRouter request failed (${res.status})`);
    err.code = 'OPENROUTER_HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error('OpenRouter returned invalid JSON');
  }

  const content = data.choices?.[0]?.message?.content;
  if (content == null || String(content).trim() === '') {
    throw new Error('OpenRouter returned empty content');
  }
  return String(content).trim();
}

module.exports = {
  chatCompletion
};
