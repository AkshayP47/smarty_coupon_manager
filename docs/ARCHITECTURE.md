# Smart Coupon Manager Architecture

## 1. High-Level Architecture

The application consists of three major services:

### Frontend

React + Vite + Tailwind CSS

Responsibilities:

* UI
* Routing
* Form handling
* Client-side validation
* API communication
* Authentication state
* Displaying backend responses

The frontend must not contain secrets.

---

### Backend

Node.js + Express + TypeScript

Responsibilities:

* Authentication
* Authorization
* Business logic
* Coupon CRUD
* Validation
* Database access
* API responses
* Security
* Communication with AI service

---

### AI Service

Python + FastAPI

Responsibilities:

* AI-specific processing
* Embedding generation
* Semantic search
* RAG
* OCR/coupon extraction in future versions

The AI service must not independently implement authentication or user authorization.

The main backend remains responsible for authorization.

---

## 2. Request Flow

Normal coupon operation:

User
↓
React Frontend
↓
Axios
↓
Express API
↓
Authentication Middleware
↓
Authorization
↓
Controller
↓
Service
↓
Database
↓
Response
↓
React UI

---

## 3. AI Request Flow

User enters a natural-language query.

Example:

"Find coupons for electronics that expire this week."

Flow:

React
↓
Backend
↓
Authentication
↓
Authorization
↓
AI Service
↓
Semantic retrieval
↓
Backend
↓
React

The backend must ensure that retrieved coupons belong to the authenticated user.

---

## 3b. Embedding Strategy & Vector Storage (decided)

* Provider/SDK: Google Gemini via the `google-genai` Python package
  (the legacy `google-generativeai` package is deprecated).
* Embedding model: `gemini-embedding-001` (configurable via `GEMINI_EMBEDDING_MODEL`).
* Embedded text per coupon: `title + code + store + category + description + discountType`.
* Ranking: cosine similarity between the query embedding and each coupon
  embedding, top-N returned. Pure-Python, unit-verified.
* Vector storage: **stateless for now** — the backend sends the user's own
  coupons with each request and the AI service ranks them in memory.
  No vectors are persisted and no keys ever leave the server side.
  If coupon volume outgrows per-request embedding, the planned path is
  MongoDB Atlas Vector Search (store one embedding per coupon, indexed);
  that migration is deferred until needed.
* Honesty rules: `/embed` without a key returns an error (never fake
  vectors); search endpoints label their `method`
  (`gemini` / `gemini-embeddings` / `keyword` / `local-fallback`).
* RAG (`POST /answer`, `POST /api/ai/ask`): retrieve the user's own coupons
  server-side, generate strictly from that context, return supporting ids.
  Generation endpoints never fall back to invented text — they return 502
  when the model is unavailable.

---

## 4. Backend Structure

Preferred structure:

backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── types/
│   └── app.ts
│
├── package.json
├── tsconfig.json
└── .env

Do not create additional architectural layers unless necessary.

---

## 5. Frontend Structure

Preferred structure:

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
└── vite.config.ts

---

## 6. AI Service Structure

Preferred structure:

ai-service/
├── app/
│   ├── api/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── main.py
│
├── requirements.txt
└── .env

---

## 7. Database Access

Only the backend should access MongoDB.

Frontend → Backend → MongoDB

Never:

Frontend → MongoDB

---

## 8. Environment Variables

Secrets must be stored in environment variables.

Examples:

MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

Never hardcode these values.

Never commit `.env`.

Provide `.env.example` containing variable names but no secrets.

---

## 9. Architectural Rule

Do not introduce:

* Redux
* GraphQL
* PostgreSQL
* Firebase
* Supabase
* Redis
* Docker
* Kubernetes
* Microservices

unless explicitly approved.

The initial project should remain simple and modular.
