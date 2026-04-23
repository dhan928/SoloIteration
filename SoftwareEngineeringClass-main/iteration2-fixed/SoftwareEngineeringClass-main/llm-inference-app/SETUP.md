# Setup Guide

## What You Need

- Node.js v16+
- Supabase account (free: https://supabase.com)
- Git

## 1. Get Supabase Ready

1. Create project at https://supabase.com
2. Go to SQL Editor and run this:

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

3. Go to Settings → API and copy:
   - Project URL = `SUPABASE_URL`
   - Anon key = `SUPABASE_ANON_KEY`

## 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
JWT_SECRET=any-secret-string
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500
```

Start backend:

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 3. Frontend Setup

From the `frontend` folder, pick one:

**Python:**
```bash
python -m http.server 5500
```

**Node:**
```bash
npm install -g http-server
http-server -p 5500
```

Open `http://127.0.0.1:5500`

## 4. Test It

1. Click "Create Account"
2. Sign up with email and password
3. Dashboard should appear with your email
4. Click "Logout" to test

## Run Tests

**Can't login**
- Password needs: 8+ chars, uppercase, number, special char
- Check Supabase has the users table
   - Should redirect to dashboard

## Environment Variables

### Backend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | JWT token from Supabase |
| `JWT_SECRET` | Secret for token signing | Generate a random string |
| `PORT` | Backend port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5500` |

## Common Issues

### "Supabase URL and ANON_KEY must be configured"

**Solution:** Create `backend/.env` with your Supabase credentials from Settings → API

### "Email already exists" error

**Solution:** Use a different email, or delete the user from Supabase table

### "Invalid credentials" on login

**Solution:** Verify email and password are correct. Password is case-sensitive.

### CORS error on signup/login

**Solution:** Make sure backend is running on port 3000 and `CORS_ORIGIN` in `.env` matches your frontend URL

### Frontend can't reach backend

**Solution:** Ensure backend is running (`npm run dev`) and frontend's `API_BASE_URL` is correct in `main.js`

## Deployment

### Backend

Deploy to Heroku, Vercel, Railway, or your hosting provider:

1. Set environment variables in hosting platform
2. Install dependencies: `npm install`
3. Run: `npm start`

### Frontend

Deploy to Netlify, Vercel, GitHub Pages, or any static host:

1. Update `API_BASE_URL` in `assets/js/main.js` to your backend URL
2. Upload `frontend/` folder
3. Set base URL to `frontend/index.html`

## File Cleanup

The following files can be removed as they're no longer needed:

- `backend/src/database/dbConnection.js` (old PostgreSQL, use supabaseClient.js instead)
- `backend/src/database/schema.sql` (old schema file)
- `test-auth.js` (temporary test file)
- `SUPABASE_SETUP.md` (covered in this guide)