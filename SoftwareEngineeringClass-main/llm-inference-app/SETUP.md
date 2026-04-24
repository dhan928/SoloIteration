# Setup Guide

## What You Need

- Node.js 18+
- Python 3 or `http-server`
- Ollama installed locally if you want local model inference
- OpenRouter API key if you want cloud model inference

## 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
SQLITE_DB_PATH=./data/app.db
PORT=3000
NODE_ENV=development
API_BASE_URL=/api/v1
CORS_ORIGIN=http://127.0.0.1:5500
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=LLM Inference App
OPENROUTER_MODEL_GPT35=openai/gpt-3.5-turbo
OPENROUTER_MODEL_GPT4=openai/gpt-4o-mini
OPENROUTER_MODEL_CLAUDE=anthropic/claude-3-haiku
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

Start backend:

```bash
npm run dev
```

The SQLite database file is created automatically.
The schema used by the app is `backend/src/database/schema_sqlite.sql`.

## 2. Frontend Setup

From the `frontend` folder:

```bash
python -m http.server 5500
```

Or:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5500`.

## 3. Test It

1. Click `Create Account`
2. Sign up with a valid email and password
3. Log in
4. Open the dashboard
5. Try both single-model and compare mode

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `SQLITE_DB_PATH` | Local SQLite database file | `./data/app.db` |
| `PORT` | Backend port | `3000` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5500` |
| `OPENROUTER_API_KEY` | OpenRouter key for cloud models | `sk-or-...` |
| `OLLAMA_BASE_URL` | Local Ollama server URL | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2` |

## Common Issues

### `Cannot find module 'sqlite3'`

Run `npm install` in `backend`.

### `Email already exists`

Use another email, or delete the existing row from the SQLite file.

### CORS error on login/signup

Check that the frontend URL matches `CORS_ORIGIN`.

### Local model does not respond

Make sure Ollama is running:

```bash
ollama serve
ollama pull llama3.2
```
