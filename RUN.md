# How to run the LLM Inference App (SoloIteration)

This repository’s **active project** lives in one place only:

**`SoftwareEngineeringClass-main/llm-inference-app/`**

Shorter commands (paths from inside `SoftwareEngineeringClass-main` only): see **[`SoftwareEngineeringClass-main/RUN.md`](SoftwareEngineeringClass-main/RUN.md)**.

Everything below uses paths from the **SoloIteration** repo root.

---

## 1. Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm**
- A **Supabase** project (URL + anon key) if you want real persistence  
- Optional: **Python 3** if you serve the frontend with `http.server` instead of a Node static server

---

## 2. One-time setup

### Backend

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\backend
npm install
```

If `npm install` fails on **Puppeteer** (Chrome download), use:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = "1"
npm install
```

### Frontend

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\frontend
npm install
```

*(If `frontend` has no `package.json`, you can skip `npm install` there and use Python or any static file server.)*

### Environment variables

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\backend
copy .env.example .env
```

Edit **`.env`** and set at least:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | API port (default `3000`) |
| `CORS_ORIGIN` | Frontend origin, e.g. `http://127.0.0.1:5500` |

**Compare mode (optional):** `OPENROUTER_API_KEY` for cloud models (GPT / Claude in the UI); `OLLAMA_BASE_URL` + `OLLAMA_MODEL` for **Local (Ollama)**. See `backend/.env.example`. If omitted, the API uses a **stub** for comparisons (enough for automated tests).

Create the **`comparisons`** and **`comparison_responses`** tables in Supabase if they are not there yet (see `backend/src/database/schema.sql`).

---

## 3. Run the app (daily use)

### Terminal A — API

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\backend
npm run dev
```

API base: **`http://localhost:3000`**  
Versioned routes: **`http://localhost:3000/api/v1/...`**

### Terminal B — static frontend

**Option A — npm (if configured):**

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\frontend
npm run dev
```

**Option B — Python:**

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\frontend
python -m http.server 5500
```

Open **`http://localhost:5500`** (or the URL printed in the terminal).  
Use **Login** → **Dashboard**; use **Compare Models** for multi-LLM comparison.

The frontend in `main.js` expects the API at **`http://localhost:3000/api/v1`**. If you change ports or hosts, update `API_BASE_URL` in `frontend/assets/js/main.js` or serve from the origin listed in `CORS_ORIGIN`.

---

## 4. Tests

### Unit tests (Jasmine)

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\backend
npm test
```

Tests preload **`tests/helpers/testEnv.js`** so the app can load without a real Supabase URL. Service specs that call Supabase over the network may still fail until valid `SUPABASE_*` values are in `.env`.

### Acceptance tests (Cucumber)

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\backend
npx cucumber-js
```

Comparison-only:

```powershell
npx cucumber-js --tags "@comparison"
```

Smoke profile:

```powershell
npx cucumber-js --profile smoke
```

### End-to-end (Puppeteer)

From repo root, Puppeteer is installed under **backend**. With **backend** and **frontend** already running:

```powershell
cd SoftwareEngineeringClass-main\llm-inference-app\frontend\e2e
node run.js
```

---

## 5. What to run (and optional zip)

**Run only:** **`SoftwareEngineeringClass-main/llm-inference-app/`** — backend + frontend for this course project.

To produce **one** zip for a TA or submission:

```powershell
cd C:\Users\danie\Documents\GitHub\SoloIteration
Compress-Archive -Path SoftwareEngineeringClass-main\llm-inference-app -DestinationPath llm-inference-app-submission.zip
```

---

## 6. More detail

See **`SoftwareEngineeringClass-main/llm-inference-app/README.md`** for endpoints, password rules, and other notes.
