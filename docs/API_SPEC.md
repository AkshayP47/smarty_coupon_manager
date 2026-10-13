# Smart Coupon Manager API Specification

Base URL:

/api

---

# Authentication

## Register

POST /api/auth/register

Request:

{
"name": "John",
"email": "[john@example.com](mailto:john@example.com)",
"password": "password"
}

Response:

{
"success": true,
"message": "User registered successfully",
"data": {}
}

---

## Login

POST /api/auth/login

Request:

{
"email": "[john@example.com](mailto:john@example.com)",
"password": "password"
}

Response:

{
"success": true,
"message": "Login successful",
"data": {}
}

---

## Logout

POST /api/auth/logout

Requires authentication.

---

# Coupons

## Create Coupon

POST /api/coupons

Requires authentication.

Request:

{
"title": "Amazon 20% Off",
"code": "SAVE20",
"description": "20% discount",
"category": "Electronics",
"store": "Amazon",
"discountType": "percentage",
"discountValue": 20,
"minimumPurchase": null,
"maximumDiscount": null,
"validFrom": null,
"expiryDate": "2026-12-31",
"usageLimit": null,
"remainingUses": null,
"termsAndConditions": null,
"source": null
}

---

## Get Coupons

GET /api/coupons

Requires authentication.

Optional query parameters:

search
category
store
status
discountType
expiryBefore (ISO date, coupons expiring on or before this date)
expiryAfter (ISO date, coupons expiring on or after this date)

---

## Get Coupon

GET /api/coupons/:id

Requires authentication.

The coupon must belong to the authenticated user.

---

## Update Coupon

PUT /api/coupons/:id

Requires authentication.

The coupon must belong to the authenticated user.

---

## Delete Coupon

DELETE /api/coupons/:id

Requires authentication.

The coupon must belong to the authenticated user.

---

# Dashboard

GET /api/dashboard

Requires authentication.

Example response:

{
"success": true,
"data": {
"totalCoupons": 0,
"activeCoupons": 0,
"expiredCoupons": 0,
"expiringSoon": 0,
"recentCoupons": []
}
}

---

# AI Search (Gemini)

POST /api/ai/search

Requires authentication. Only the authenticated user's coupons are searched.

Request:

{
"query": "20% off electronics",
"limit": 10
}

The backend forwards `{ query, coupons, limit }` to `AI_SERVICE_URL/search`
(`ai-service`, default model `gemini-1.5-flash`, key via `GEMINI_API_KEY`).
If the AI service is unconfigured or unreachable, the backend falls back
to deterministic keyword matching and reports `"method": "local-fallback"`
(`"gemini"` or `"keyword"` otherwise).

Example response:

{
"success": true,
"data": {
"coupons": [],
"method": "gemini"
}
}

---

# AI Semantic Search (Gemini embeddings)

POST /api/ai/semantic-search

Requires authentication. Only the authenticated user's coupons are searched.

Request:

{
"query": "cheap food delivery",
"limit": 10
}

The backend forwards `{ query, coupons, limit }` to
`AI_SERVICE_URL/semantic-search`. The AI service embeds the query and each
coupon with `GEMINI_EMBEDDING_MODEL` (default `text-embedding-004`) and
ranks by cosine similarity (`"method": "gemini-embeddings"`).
Without a key, or if the AI service is unreachable, both layers fall back
to deterministic keyword matching (`"method": "keyword"` /
`"local-fallback"`).

AI-service primitives (no auth; server-side only):

POST /search `{ query, coupons, limit }` — Gemini rank, else keyword.
POST /semantic-search `{ query, coupons, limit }` — embeddings rank, else keyword.
POST /embed `{ texts }` — raw embeddings; errors without a key (never faked).

---

# AI Screenshot Extraction (Gemini vision)

POST /api/ai/extract

Requires authentication. Accepts a base64 image (max ~5MB raw) and returns
a coupon *draft* for the user to review — nothing is created automatically.

Request:

{
"image": "<base64>",
"mimeType": "image/png"
}

The backend forwards to `AI_SERVICE_URL/extract`, which uses the Gemini
vision model (`GEMINI_MODEL`) and returns sanitized fields only
(unknown keys dropped, `discountType` normalized, `discountValue` coerced).
Without a key, or if the AI service is unreachable, it returns 502 with
`success: false` — extraction results are never faked.

---

# AI Ask / RAG (grounded answering)

POST /api/ai/ask

Requires authentication. Answers a natural-language question using ONLY
the authenticated user's coupons as context (retrieve-then-generate).

Request:

{
"question": "Which coupons expire this week?",
"limit": 5
}

The backend forwards `{ question, coupons, limit }` to `AI_SERVICE_URL/answer`.
The AI service answers strictly from the supplied coupons and returns the
supporting coupon ids; the backend maps them back to full coupon documents.
Without a key, or if the AI service is unreachable, it returns 502 with
`success: false` — answers are never invented.

Example response:

{
"success": true,
"data": {
"answer": "PIZZA5 saves you $5, expiring Friday.",
"coupons": [],
"model": "gemini-1.5-flash"
}
}

---

# API Rules

All APIs must:

* Validate input
* Authenticate protected requests
* Authorize resources
* Return consistent responses
* Return appropriate HTTP status codes
* Never expose passwords
* Never expose secret environment variables

Do not add APIs without documenting them here first.
