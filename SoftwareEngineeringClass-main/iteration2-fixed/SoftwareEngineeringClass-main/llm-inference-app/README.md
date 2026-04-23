# LLM Inference App

Simple web app for running LLM inferences. Uses Supabase for data and a Node REST API for communication.

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
python -m http.server 5500
```

Open `http://127.0.0.1:5500` in your browser.

## Configuration

Create `backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
JWT_SECRET=your-secret-key
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500
```

Get your Supabase URL and key from the Supabase dashboard.

## How It Works

The app uses Supabase (PostgreSQL) for storage. Here's the flow:

1. **Sign Up** - Creates a user in Supabase, stores hashed password
2. **Login** - Retrieves user, checks password, returns JWT token
3. **Dashboard** - Uses token to fetch user profile and chat history

All communication is REST API over HTTP with JSON.

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Get JWT token

### User
- `GET /api/v1/users/profile` - Get user info (needs token)

See `API_ROUTES.md` for full details.

## Database

Supabase tables:

- `users` - email, password_hash, user_id, created_at
- `inferences` - user_id, prompt, response, created_at

No setup needed - Supabase handles everything.

## Testing

```bash
cd backend
npm test
```

Runs 30 unit tests for validation and user service.

## Passwords

Must be:
- 8+ characters
- One uppercase letter
- One number
- One special character (!@#$%^&*)

## Troubleshooting

**Backend won't start**
- Did you create `.env`?
- Is Supabase URL correct?

**Can't login**
- Is backend running on port 3000?
- Check browser console for errors

**Network errors**
- Backend and frontend both running?
- Is `CORS_ORIGIN` set to `http://127.0.0.1:5500`?
