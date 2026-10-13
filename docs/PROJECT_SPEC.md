# Smart Coupon Manager

## 1. Project Overview

Smart Coupon Manager is a web application that allows users to store, organize, search, and retrieve their coupons from a single place.

The primary problem being solved is:

Users often receive coupons through screenshots, emails, websites, messages, or promotional campaigns and later forget where the coupon is stored.

The application allows users to save coupon information and retrieve relevant coupons when needed.

---

## 2. Primary Goal

Build a reliable coupon management application with:

* User authentication
* Coupon creation
* Coupon editing
* Coupon deletion
* Coupon categorization
* Coupon search
* Coupon filtering
* Coupon expiration tracking
* Coupon status tracking
* Dashboard
* Secure user-specific data
* Optional AI-powered coupon retrieval

The core coupon-management functionality must work WITHOUT AI.

AI must be treated as an additional feature, not as a dependency for basic functionality.

---

## 3. Initial MVP

The first version MUST implement only the following:

### Authentication

* User registration
* User login
* User logout
* Password hashing
* Authentication middleware
* User-specific authorization

### Coupon Management

Users can:

* Create coupons
* View coupons
* View a single coupon
* Edit coupons
* Delete coupons

### Coupon Fields

Each coupon should contain:

* title
* code
* description
* category
* store
* discount_type
* discount_value
* minimum_purchase
* maximum_discount
* valid_from
* expiry_date
* usage_limit
* remaining_uses
* terms_and_conditions
* source
* created_at
* updated_at

### Search

Users must be able to search coupons by:

* title
* coupon code
* store
* category
* description

### Filtering

Users should be able to filter coupons by:

* category
* store
* active/expired status
* discount type
* expiry date

### Dashboard

Dashboard should show:

* Total coupons
* Active coupons
* Expired coupons
* Coupons expiring soon
* Recently added coupons

---

## 4. Future Features

The following features are NOT part of the initial MVP.

They may be implemented later:

### AI Features

* Natural-language coupon search
* Semantic search
* RAG-based coupon retrieval
* AI-powered coupon recommendations
* Automatic coupon information extraction
* Screenshot/OCR-based coupon extraction

### Other Future Features

* Browser extension
* Mobile application
* Email coupon importing
* Automatic coupon expiry notifications
* Coupon sharing
* Public coupon discovery
* Analytics
* Personalized recommendations

Agents MUST NOT implement future features unless explicitly instructed.

---

## 5. Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* MongoDB
* MongoDB Atlas for production/cloud deployment

### AI Service

AI functionality should be isolated from the main backend.

Preferred technology:

* Python
* FastAPI

The AI service must communicate with the main backend through clearly defined APIs.

---

## 6. Architecture Principle

The application should follow this logical structure:

Frontend
↓
Backend API
↓
Database

AI functionality:

Frontend
↓
Backend API
↓
AI Service
↓
AI Model / Vector Database

The frontend MUST NOT directly communicate with the database.

The frontend MUST NOT contain secret API keys.

The frontend MUST NOT directly communicate with OpenAI or other private AI APIs.

---

## 7. Security Requirements

The application must:

* Hash passwords securely
* Never store plaintext passwords
* Never expose database credentials
* Never expose API keys to the frontend
* Validate user input
* Authenticate protected endpoints
* Authorize access to user-owned coupons
* Prevent users from accessing another user's coupons
* Validate IDs before database queries
* Handle invalid requests safely
* Use environment variables for secrets
* Never commit `.env` files

---

## 8. User Ownership

Every coupon belongs to exactly one user.

A user can only:

* Create coupons for themselves
* Read their own coupons
* Update their own coupons
* Delete their own coupons

The backend MUST enforce ownership.

Frontend checks are NOT sufficient for authorization.

---

## 9. API Design

The backend should expose REST APIs.

Example structure:

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/coupons
POST   /api/coupons
GET    /api/coupons/:id
PUT    /api/coupons/:id
DELETE /api/coupons/:id

GET    /api/dashboard

Additional endpoints may be added only when justified by the architecture.

---

## 10. Error Handling

The backend must return consistent error responses.

Example:

{
"success": false,
"message": "Coupon not found"
}

Successful responses should follow a consistent structure.

Example:

{
"success": true,
"data": {}
}

Agents must not invent response structures independently across different endpoints.

---

## 11. Code Quality

Code must be:

* Modular
* Readable
* Maintainable
* Type-safe
* Properly validated
* Properly documented where necessary

Avoid:

* duplicated logic
* unnecessary abstractions
* giant files
* hardcoded secrets
* unused dependencies
* unnecessary libraries
* speculative features

---

## 12. Development Rule

The agent must never silently change:

* technology stack
* database
* API architecture
* authentication strategy
* folder structure
* data model

If a change is required, the agent must explain the reason and request approval before making a major architectural change.

---

## 13. Source of Truth

The following files define the project:

1. PROJECT_SPEC.md
2. ARCHITECTURE.md
3. DATABASE_SCHEMA.md
4. API_SPEC.md
5. UI_SPEC.md
6. DEVELOPMENT_RULES.md
7. TASKS.md

If information conflicts between files, the agent must STOP and ask for clarification instead of guessing.

---

## 14. MVP Priority

Priority order:

1. Authentication
2. Database
3. Coupon CRUD
4. Authorization
5. Search
6. Filtering
7. Dashboard
8. UI polish
9. Testing
10. AI features

AI must not delay or break the core coupon management functionality.
