const config = require('../config/config');

/**
 * Ollama /api/chat (non-streaming).
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */
async function chat(ollamaModelName, prompt, { temperature = 0.7, maxTokens = 500 } = {}) {
  const base = config.ollama.baseUrl.replace(/\/$/, '');
  if (!base) {
    const err = new Error('Ollama is not configured (set OLLAMA_BASE_URL)');
    err.code = 'OLLAMA_NOT_CONFIGURED';
    throw err;
  }

  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModelName,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens
      }
    })
  });

  const raw = await res.text();
  if (!res.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw);
      message = j.error || j.message || raw;
    } catch (_) {
      /* keep raw */
    }
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.code = 'OLLAMA_HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error('Ollama returned invalid JSON');
  }

  const content = data.message?.content;
  if (content == null || String(content).trim() === '') {
    throw new Error('Ollama returned empty content');
  }
  return String(content).trim();
}

module.exports = {
  chat
};
