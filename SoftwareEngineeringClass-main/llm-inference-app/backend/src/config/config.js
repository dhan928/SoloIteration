require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    expiration: process.env.JWT_EXPIRATION || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || '/api/v1',
    version: 'v1'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
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
