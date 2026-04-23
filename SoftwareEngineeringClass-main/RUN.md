# How to run the LLM Inference App

The application code is in **`llm-inference-app/`** (this folder). Commands below start from **`SoftwareEngineeringClass-main`** (where this file is).

---

## Prerequisites

- Node.js 18+ (20 LTS recommended), npm  
- Supabase project (optional for local UI; required for real auth/data)  
- Python 3 *or* use `npm run dev` in `frontend` if available  

---

## Install

```powershell
cd llm-inference-app\backend
npm install
```

If Puppeteer’s Chrome download fails:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = "1"
npm install
```

```powershell
cd ..\frontend
npm install
```

---

## Configure

```powershell
cd ..\backend
copy .env.example .env
```

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` (e.g. `http://127.0.0.1:5500`). Apply SQL from `backend/src/database/schema.sql` in Supabase if tables are missing.

### Multi-model comparison (OpenRouter + Ollama)

- **`OPENROUTER_API_KEY`** — from [openrouter.ai/keys](https://openrouter.ai/keys). When set, **GPT-3.5 / GPT-4 / Claude** options in Compare mode call OpenRouter (model slugs are configurable in `.env.example`).
- **`OLLAMA_BASE_URL`** — e.g. `http://127.0.0.1:11434` with **`ollama serve`** running and a model pulled (e.g. `ollama pull llama3.2`). When set, **Local (Ollama)** uses **`OLLAMA_MODEL`** (default `llama3.2`).
- If these are unset, comparison still runs using the built-in **stub** (fine for tests; local stub still fails `local-small` unless Ollama is configured).

---

## Run

**API (terminal 1):**

```powershell
cd llm-inference-app\backend
npm run dev
```

**Frontend (terminal 2):**

```powershell
cd llm-inference-app\frontend
npm run dev
```

*or*

```powershell
python -m http.server 5500
```

Open **http://localhost:5500** (adjust if your server prints a different URL). Ensure `frontend/assets/js/main.js` `API_BASE_URL` matches your API and `CORS_ORIGIN` on the server.

---

## Tests

```powershell
cd llm-inference-app\backend
npm test
npx cucumber-js
npx cucumber-js --tags "@comparison"
```

E2E (with backend + frontend running; Puppeteer from backend `node_modules`):

```powershell
cd llm-inference-app\frontend\e2e
node run.js
```

---

## One submission zip

From this folder’s parent (e.g. `SoloIteration`):

```powershell
Compress-Archive -Path SoftwareEngineeringClass-main\llm-inference-app -DestinationPath llm-inference-app-submission.zip
```

Or zip **`llm-inference-app`** alone if you only ship that subtree.

---

More API and password details: **`llm-inference-app/README.md`**.
