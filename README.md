# Smart Coupon Manager

Store, organize, search, and retrieve coupons — with optional Gemini-powered
natural-language search, semantic search, grounded Q&A, and screenshot extraction.
Core coupon management works fully WITHOUT any AI key configured.

## Features

* Auth (register / login / logout, JWT, per-user ownership)
* Coupon CRUD, search, filters (category, store, status, discount type, expiry range)
* Dashboard (totals, expiring soon, recently added)
* AI: Gemini rank, semantic search (embeddings), ask-about-coupons (RAG), screenshot prefill
* Without a key (or if the AI service is down) every AI feature degrades
  honestly — keyword results or clear errors, never invented data

## Tech Stack

* **Frontend:** React + Vite + Tailwind CSS + React Router (port 3000)
* **Backend:** Node.js + Express + TypeScript + Mongoose (port 5000)
* **AI Service:** Python + FastAPI + `google-genai` (port 8000)
* **Database:** MongoDB Atlas

## Setup

```powershell
# backend
cd backend
npm install
# create backend/.env (see table below)
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev

# ai-service (new terminal, venv only)
cd ai-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

### `backend/.env`

| Variable         | Required | Purpose                                  |
| ---------------- | -------- | ---------------------------------------- |
| `PORT`           | no       | Defaults to 5000                         |
| `MONGODB_URI`    | yes      | Atlas connection string (with db name)   |
| `JWT_SECRET`     | yes      | Any long random string                   |
| `AI_SERVICE_URL` | no       | Defaults to `http://localhost:8000`      |

### AI key (optional)

Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`)
wherever you run the AI service — e.g. `ai-service/.env` or the project root
`.env` (it auto-loads the root one). Without it, AI endpoints return keyword
results or honest errors.

The frontend proxies `/api` to the backend (see `vite.config.ts`).

## Tests

```powershell
cd backend  # 46 tests: auth, CRUD, ownership, search, filters, dashboard, AI proxy
npm test
cd ../frontend  # 16 tests: routing guards, login, list, filters, AI modes, prefill, ask
npm test
```

## Project Layout

```text
backend/    Express API (src/controllers, routes, models, middleware) + vitest suite
frontend/   React app (pages, context, components) + Testing Library suite
ai-service/ FastAPI (rank, semantic search, RAG answer, OCR extract) on venv only
docs/       PROJECT_SPEC, ARCHITECTURE, API_SPEC, DATABASE_SCHEMA, UI_SPEC, TASKS
```
