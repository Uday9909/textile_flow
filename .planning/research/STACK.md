# Technology Stack: Authentication Layer

**Project:** TextileFlow MES
**Researched:** 2026-06-15
**Scope:** JWT-based authentication for React SPA with Express backend
**Mode:** Ecosystem research (subsequent milestone — auth layer only)
**Overall confidence:** HIGH (patterns) / MEDIUM (version accuracy)

## Executive Summary

Adding authentication to an existing brownfield React SPA involves two independent pieces: an Express backend that issues and validates JWTs, and a frontend auth layer that manages tokens, protects routes, and integrates with existing React Context state management. The recommended stack follows the 2025 industry-standard pattern: short-lived access tokens with refresh token rotation, httpOnly cookies for refresh tokens, and a dedicated AuthContext separate from the existing AppContext.

## Recommended Stack

### Backend (Runtime & Framework)

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Node.js | 22 LTS | Runtime | Long-term support, native fetch, built-in test runner |
| Express | 4.21+ | HTTP framework | Matches project's JS stack, minimal, well-understood |
| express-async-errors | 0.x | Async error handling | Catches unhandled promise rejections in Express handlers |

### Backend (Authentication)

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| jose | 5.x | JWT creation/verification | Modern replacement for jsonwebtoken, uses Web Crypto API, better security defaults |
| bcryptjs | 2.4.x | Password hashing | Pure JS, no native compilation needed for Vercel serverless |
| cookie-parser | 1.4.x | Cookie parsing | Read httpOnly refresh token cookies |

### Backend (Middleware)

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| helmet | 8.x | Security headers | Sets secure HTTP headers, industry standard |
| cors | 2.x | CORS configuration | Required for SPA↔API cross-origin communication |
| express-rate-limit | 7.x | Rate limiting | Protect login/password-reset from brute-force |

### Backend (Database)

| Context | Recommendation |
|---------|---------------|
| Local dev | SQLite via better-sqlite3 (zero-config, file-based) |
| Vercel production | Vercel Postgres (Neon) or Vercel KV (Upstash Redis) |
| Standalone server | better-sqlite3 or SQLite |

**Note:** JSON file store is acceptable for v1 local development only. Serverless environments (Vercel) have read-only filesystems — use a real data store for production.

### Backend (Email for Password Reset)

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| nodemailer | SMTP email sending | Lowest dependency, works with any SMTP provider |
| resend | Transactional email API | Better deliverability, simpler API (preferred for new projects) |

### Frontend (No New Dependencies)

- **React Context** — create dedicated `AuthContext` (separate from existing `AppContext`)
- **fetch** (native) — no axios needed for 4-5 auth API calls
- **ProtectedRoute component** — wraps existing route definitions in `App.jsx`

## Frontend Integration Pattern

```
<AuthProvider>           ← New: manages auth state, token persistence, login/logout
  <AppProvider>          ← Existing: lot management state (unchanged)
    <Router>
      <ProtectedRoute role="admin|supervisor|operator">
        <Route ... />
      </ProtectedRoute>
      <Route path="/login" />
    </Router>
  </AppProvider>
</AuthProvider>
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| jose > jsonwebtoken | Modern, Web Crypto API, no native deps, actively maintained |
| bcryptjs > bcrypt | Pure JS, works in serverless environments |
| Custom middleware > passport.js | 5-endpoint auth API doesn't need passport's abstraction overhead |
| Separate AuthContext > modifying AppContext | Different lifecycle, persistence, and security concerns |
| httpOnly cookie for refresh token | Not JS-accessible, mitigates XSS token theft |

## Alternatives Considered

| Category | Recommended | Alternative Rejected | Why |
|----------|-------------|---------------------|-----|
| JWT library | jose 5.x | jsonwebtoken | Sync API, past CVEs, less maintained |
| Password hashing | bcryptjs | bcrypt | Native compilation fails in serverless/CI |
| Auth middleware | Custom | passport.js | Overkill for 4-5 endpoints |
| Frontend HTTP | native fetch | axios | Adds bundle weight for no benefit |
| ORM | Knex.js or raw | Prisma, Drizzle | 2-3 tables don't justify ORM overhead |
| Deployment | Vercel serverless | Standalone server | Simpler, everything on one platform |

## Installation

```bash
# Backend
mkdir server && cd server
npm init -y
npm install express jose bcryptjs cookie-parser cors helmet express-rate-limit
npm install dotenv nodemailer
npm install -D nodemon
```

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| JWT library choice | HIGH | jose is well-established successor |
| Password hashing | HIGH | bcryptjs is standard |
| Token storage strategy | HIGH | OWASP-recommended pattern |
| Middleware packages | HIGH | Stable, mature ecosystems |
| Version accuracy | MEDIUM | Verify exact latest versions at install time |

*Stack research: 2026-06-15*
