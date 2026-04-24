# LLM Inference App

Simple web app for single-model prompts and multi-model comparison. The backend uses a local SQLite database file, OpenRouter for cloud models, and Ollama for local models.

**Run guide:** [`RUN.md`](../RUN.md)  
**Iteration 3 report:** [`ITERATION3_REPORT.md`](./ITERATION3_REPORT.md)  
**Database tracker:** [`backend/src/database/DATABASE_TRACKER.md`](./backend/src/database/DATABASE_TRACKER.md)

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
python -m http.server 5500
```

Open `http://127.0.0.1:5500` in your browser.

## Configuration

Create `backend/.env` using `.env.example`:

```env
SQLITE_DB_PATH=./data/app.db
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500
OPENROUTER_API_KEY=your_openrouter_key
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

### Multi-model comparison

- Set `OPENROUTER_API_KEY` to use GPT and Claude options through [OpenRouter](https://openrouter.ai/).
- Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL` to use your local Ollama model.
- If one or both are unset, the app falls back to stubbed responses where possible.

## How It Works

1. **Sign Up** creates a user in the local SQLite database.
2. **Login** validates the password and stores the returned user in browser local storage.
3. **Dashboard** sends `X-User-Id` on API calls instead of using JWT.
4. **Compare Mode** submits one prompt to multiple models and stores the result in SQLite.

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Start a local session
- `POST /api/v1/auth/logout` - Clear session on the client side

### User
- `GET /api/v1/users/profile` - Get current user profile

### Inference
- `POST /api/v1/inference/submit` - Submit one prompt to one model
- `POST /api/v1/inference/compare` - Submit one prompt to multiple models

See [`API_ROUTES.md`](./API_ROUTES.md) for the full routing table.

## Database

The actual app schema is in:

- `backend/src/database/schema_sqlite.sql`

The simplified class-report schema is in:

- `backend/src/database/schema_basic.sql`

The SQLite file is created automatically at the `SQLITE_DB_PATH` location.

## Testing

```bash
cd backend
npm test
```

## Password Rules

- 8+ characters
- One uppercase letter
- One number
- One special character (`!@#$%^&*`)
