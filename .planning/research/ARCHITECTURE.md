# Architecture: Authentication Layer

**Project:** TextileFlow MES
**Researched:** 2026-06-15
**Scope:** Auth system architecture for React SPA + Express backend

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ AuthContext │  │  api.js     │  │  ProtectedRoute          │ │
│  │ - token mgmt│  │  fetch wrap │  │  - auth check            │ │
│  │ - user state│  │  auto-auth  │  │  - role check            │ │
│  │ - login/log │  │  401→refresh│  │  - redirect to /login    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          │ HTTP requests with Authorization header│
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   CORS /    │
                    │  Same-Origin│
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       Backend (Express)                          │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Middleware  │  │ Auth Routes  │  │ Data Store             │  │
│  │ - helmet    │  │ POST /login  │  │ - users (id,email,    │  │
│  │ - cors      │  │ POST /logout │  │   hash,role,dept)     │  │
│  │ - rate-limit│  │ POST /refresh│  │ - refresh_tokens      │  │
│  │ - authN     │  │ GET /me      │  │ - reset_tokens        │  │
│  │ - authZ     │  │ POST /forgot │  │                        │  │
│  │             │  │ POST /reset  │  │ SQLite (dev) /         │  │
│  │             │  │              │  │ Vercel Postgres (prod) │  │
│  └────────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Frontend Components

| Component | Responsibility | Pattern |
|-----------|---------------|---------|
| **AuthContext** | Token management, user state, login/logout actions, initialize from localStorage | React Context + useReducer |
| **api.js** | Fetch wrapper with auto Authorization header, 401 intercept → refresh → retry | Service module |
| **ProtectedRoute** | Check auth state, redirect to `/login` if unauthenticated, show 403 if wrong role | React component |
| **LoginPage** | Email/password form, error display, redirect on success | Page component (new) |
| **ForgotPasswordPage** | Email input, success message, reset link handling | Page component (new) |

### Backend Components

| Component | Responsibility |
|-----------|---------------|
| **Auth Middleware** | JWT verification from Authorization header, attach `req.user` |
| **Role Middleware** | Check `req.user.role` against allowed roles for route |
| **Auth Routes** | Login, logout, refresh, me, forgot-password, reset-password |
| **User Store** | CRUD for users (password hashing, role assignment) |
| **Token Store** | Refresh token persistence and validation |

## Data Flows

### Login Flow
```
LoginPage → POST /api/auth/login → validate credentials → 
  generate access token + refresh token → return both → 
  AuthContext stores access token in memory → redirect to dashboard
```

### Authenticated Request Flow
```
ProtectedRoute → check AuthContext → if no token, redirect to /login
API call → api.js → attach Authorization: Bearer <token> → 
  Backend: auth middleware → verify JWT → attach req.user → route handler
  If 401 → api.js interceptor → POST /api/auth/refresh → 
    if success → retry original request
    if fail → AuthContext → LOGOUT → redirect to /login
```

### Role Check Flow
```
Route definition: router.get('/admin/users', authenticate, authorize('admin'), handler)
  authenticate: verify JWT → set req.user
  authorize('admin'): check req.user.role === 'admin' → 403 if not
  handler: process request
```

## Build Order

Strictly tiered — backend first, frontend depends on backend:

| Tier | Components | Dependencies |
|------|-----------|--------------|
| 1 | Express server, User model, JWT utils | None |
| 2 | Login API, auth middleware, GET /me | Tier 1 |
| 3 | AuthContext, api.js service | Tier 2 |
| 4 | LoginPage, ProtectedRoute, route updates | Tier 3 |
| 5 | Role-based UI (Sidebar, TopBar), remove OperatorPrompt | Tier 4 |
| 6 | Password reset API + pages | Tier 2 |
| 7 | User management (admin CRUD) | Tier 4 + Tier 6 |

## Vercel Deployment

Two approaches:

### Option A: Express as Serverless Function (Recommended)
- Express runs as Vercel serverless function via `@vercel/node`
- Routes: `/api/auth/*` → serverless function
- `vercel.json` with `/api/*` rewrites before SPA catch-all
- Database: Vercel Postgres (Neon) or Vercel KV (Upstash Redis)
- **Limitation:** Cold starts (1-3s) and read-only filesystem

### Option B: Standalone Express Server
- Express on Railway/Render/Fly.io
- CORS configured for Vercel SPA domain
- SQLite or any database
- **Benefit:** Simpler, no cold starts, persistent filesystem
- **Cost:** ~$5-7/month

*Architecture research: 2026-06-15*
