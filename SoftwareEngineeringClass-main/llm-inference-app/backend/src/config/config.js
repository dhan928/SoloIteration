require('dotenv').config();

function parseCorsOrigins(value) {
  const raw = (value || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return raw.length > 0 ? raw : ['http://localhost:5500', 'http://127.0.0.1:5500'];
}

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // SQLite Configuration
  database: {
    file: process.env.SQLITE_DB_PATH || './data/app.db'
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || '/api/v1',
    version: 'v1'
  },

  // CORS Configuration
  cors: {
    origin(origin, callback) {
      const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

      // Allow server-to-server tools and same-origin/non-browser requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  },

  // OpenRouter (cloud models: gpt-3.5-turbo, gpt-4, claude-v1 in comparison UI)
  openrouter: {
    apiKey: (process.env.OPENROUTER_API_KEY || '').trim(),
    httpReferer: process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000',
    appTitle: process.env.OPENROUTER_APP_TITLE || 'LLM Inference App',
    modelSlugs: {
      'gpt-3.5-turbo': process.env.OPENROUTER_MODEL_GPT35 || 'openai/gpt-3.5-turbo',
      'gpt-4': process.env.OPENROUTER_MODEL_GPT4 || 'openai/gpt-4o-mini',
      'claude-v1': process.env.OPENROUTER_MODEL_CLAUDE || 'anthropic/claude-3-haiku'
    }
  },

  // Ollama (local model: "local-small" in the UI uses OLLAMA_MODEL, e.g. llama3.2). Set OLLAMA_BASE_URL when ollama serve is running.
  ollama: {
    baseUrl: (process.env.OLLAMA_BASE_URL || '').trim().replace(/\/$/, ''),
    model: (process.env.OLLAMA_MODEL || 'llama3.2').trim()
  }
};
