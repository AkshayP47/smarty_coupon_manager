# How It Works — Smart Coupon Manager (Developer's Guide)

New here? Read this first. The spec files (`PROJECT_SPEC.md`, `ARCHITECTURE.md`,
`API_SPEC.md`) say what the system *must* do; this file explains how it
*actually* works, step by step.

## 1. The big picture

```text
Browser (React + Vite, :3000)
  │  axios, baseURL "/api" (Vite proxies it to the backend)
  ▼
Backend (Express + TypeScript, :5000)
  │  talks to MongoDB Atlas, enforces who owns what
  ▼
MongoDB Atlas (users + coupons collections)

Backend ──► AI Service (FastAPI, :8000) ──► Google Gemini
(auth + ownership first, AI second — the AI never sees other users' data)
```

Three processes, three terminals. No process talks to a database except the
backend. The frontend never sees any API key. The AI service has no auth of
its own — it trusts the backend, which only ever sends it the *current
user's* coupons.

## 2. A request's journey (backend)

`src/index.ts` starts the server → `src/app.ts` wires middleware **in order**:

1. `helmet()` — security headers
2. `cors()` — cross-origin rules
3. `express.json()` — parses JSON bodies
4. `connectDB()` — opens the Mongoose connection (fails fast with `process.exit(1)`)
5. Routes: `/health`, `/api/auth`, `/api/coupons`, `/api/dashboard`, `/api/ai`
6. `errorHandler` — last stop for thrown errors

Protected routes run the `authenticate` middleware first (`src/middleware/auth.ts`):
it reads `Authorization: Bearer <token>`, verifies the JWT with `JWT_SECRET`,
and sets `req.userId`. Missing/bad token → `401`, and the frontend's axios
interceptor (`frontend/src/services/api.ts`) wipes the token and bounces you to
`/login` on any 401.

## 3. Auth flow

* **Register** (`POST /api/auth/register`): validates fields → rejects duplicate
  email → `bcrypt` hash (cost 12, see `src/services/authService.ts`) → creates
  user → returns JWT (30 days) + public user object. Passwords are never stored
  or returned in plain text.
* **Login** (`POST /api/auth/login`): finds user → `bcrypt.compare` → same token
  shape. Wrong password and unknown email both return `401` (deliberately
  identical — no user enumeration).
* **Frontend** (`src/context/AuthContext.tsx`): keeps `token` in state (seeded
  from `localStorage`), fetches `/auth/profile` whenever it changes.
  `ProtectedRoute` in `App.tsx` redirects to `/login` when there is no token.

## 4. Ownership — the one rule that matters

Every coupon has a `userId`. **Every** coupon query is scoped to it:

```ts
Coupon.findOne({ _id: req.params.id, userId: req.userId })
```

Another user's coupon id → `404` (not `403`, so ids can't be probed).
The list endpoint only ever returns your rows. Frontend links are convenience
only — the backend re-checks everything. This is covered by tests in
`src/routes/coupons.test.ts` ("hides user A's coupons from user B").

## 5. Search, filters, dashboard

`GET /api/coupons` accepts: `search` (case-insensitive match across
title/code/store/category/description), `category`, `store`, `status`
(`active`/`expired` = expiryDate ≥/< now), `discountType`, `expiryBefore`,
`expiryAfter` (ISO dates, `400` if unparsable).

`GET /api/dashboard` returns totals + `recentCoupons` (latest 5). Note:
coupons **without** an expiry date count toward `totalCoupons` but toward
neither `activeCoupons` nor `expiredCoupons` (Mongo range filters skip nulls).

## 6. AI flows (all optional, all honest)

| UI entry point              | Backend route             | AI-service route   | Live method            | Without key / AI down        |
| --------------------------- | ------------------------- | ------------------ | ---------------------- | ---------------------------- |
| Coupon list → AI Search     | `POST /api/ai/search`     | `POST /search`     | `gemini` (LLM ranking) | `keyword` / `local-fallback` |
| Coupon list → Semantic mode | `POST /api/ai/semantic-search` | `POST /semantic-search` | `gemini-embeddings` (cosine) | same fallbacks         |
| Dashboard → Ask             | `POST /api/ai/ask`        | `POST /answer`     | grounded answer + cited ids | `502`, never invented  |
| Create form → screenshot    | `POST /api/ai/extract`    | `POST /extract`    | vision → draft fields  | `502`, never faked           |

Design rules (see `ARCHITECTURE.md` §3b):

* The backend loads **your** coupons and sends them along; the AI ranks/answers
  over that context only. Nothing is persisted on the AI side (stateless —
  Atlas Vector Search is the documented future path, not implemented).
* Every response carries a `method` label telling you which path actually ran.
* Generation calls retry transient 5xx up to 3× (exponential backoff); other
  errors fail fast.
* Model names rot (we've survived two retirements). `GEMINI_MODEL` and
  `GEMINI_EMBEDDING_MODEL` env vars exist so the fix is config, not code.
  If AI breaks with 502s, check `GET /health` on the AI service and verify
  the model names against `ModelService.ListModels` before touching code.

## 7. Configuration — which file each process reads

| Process  | Working dir when started | Reads                              |
| -------- | ------------------------ | ---------------------------------- |
| Backend  | `backend/`               | `backend/.env`                     |
| AI svc   | `ai-service/`            | nearest `.env` upward (= repo root)|
| Frontend | `frontend/`              | none (uses Vite proxy → `:5000`)   |

Key vars: `MONGODB_URI` (with db name), `JWT_SECRET`, `AI_SERVICE_URL`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`. See
`.env.example`. **Never commit `.env`** (gitignored and verified).

> **Trap we hit twice:** `dotenv` never overrides an already-exported shell
> variable. A stale `$env:MONGODB_URI` / `$env:GEMINI_MODEL` in your terminal
> silently beats the file. If the app disagrees with your `.env`, check
> `echo $env:VAR` (PowerShell) / `echo %VAR%` (CMD) first.

## 8. Run & test

```powershell
cd backend;   npm install; npm run dev     # :5000 (needs backend/.env)
cd frontend;  npm install; npm run dev     # :3000 (or next free port)
cd ai-service; python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

Tests: `npm test` in `backend/` (46: auth, CRUD, ownership, search, filters,
dashboard, AI proxy — in-memory Mongo, no Atlas touched) and in `frontend/`
(16: routing guards, login, list, filters, AI modes, prefill, ask — API
mocked). Builds: `npm run build` in both; `py_compile` for the AI service.

## 9. Troubleshooting greatest hits

* `MODULE_NOT_FOUND iconv-lite/...` → `node_modules` corrupted (interrupted
  install). Delete it, `npm ci`.
* `EADDRINUSE :5000` → an orphan server holds the port (often a timed-out
  probe). Find it: `Get-NetTCPConnection -LocalPort 5000` → `Stop-Process`.
* `MongooseServerSelectionError` → Atlas Network Access: whitelist your IP.
* `bad auth` → DB-user password/user wrong (Atlas **Database Access**, not your
  Atlas login). Test with a scratch script before blaming code.
* Nodemon ignores `.env` edits (watches `ts,json` only) — restart manually.
* Vitest + Node 26: native `localStorage` stub shadows jsdom's —
  `src/test/setup.ts` installs an in-memory polyfill. Don't remove it.
* `vitest.config.ts` ESM warning in backend — cosmetic, ignore it.
