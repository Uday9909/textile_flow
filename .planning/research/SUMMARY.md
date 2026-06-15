# Research Summary: Authentication for TextileFlow MES

**Domain:** Authentication for React SPA + Express Backend
**Researched:** 2026-06-15
**Overall confidence:** HIGH (well-documented domain with stable patterns)

## Executive Summary

TextileFlow MES needs an authentication layer for its existing React SPA with an Express.js REST API backend. The industry-standard 2025 pattern applies: short-lived access tokens (10-15 min) in memory, refresh tokens in httpOnly Secure SameSite=Strict cookies, and role-based access control for three roles (operator, supervisor, admin). The recommended stack is Node.js 22 LTS, Express 4.21+, jose 5.x for JWT, bcryptjs for password hashing, and a dedicated AuthContext separate from the existing AppContext.

Three findings dominate the roadmap. First, auth introduces a security-sensitive dependency chain built tier by tier. Second, the token storage strategy is the most important architectural decision — localStorage for JWTs is the most common pitfall and must be ruled out early. Third, the factory-floor context simplifies many decisions (no OAuth, no self-registration, no MFA) but makes persistent sessions and rate-limited login the primary concerns.

## Key Findings

| Area | Finding | Confidence |
|------|---------|------------|
| **Stack** | jose > jsonwebtoken; bcryptjs > bcrypt; custom middleware > passport.js; httpOnly cookies > localStorage | HIGH |
| **Features** | 9 table stakes features, 6 deferrable differentiators, 8 anti-features to never build | HIGH |
| **Architecture** | Separate AuthContext; backend-first middleware enforcement; 7-tier dependency graph | HIGH |
| **Pitfalls** | localStorage token storage is #1 risk; client-side-only role gating must be replaced | HIGH |

## Roadmap Implications

**Suggested phases: 4 + post-MVP backlog**

1. **Phase 1: Backend Foundation** — Express server, user model, JWT utils, login API, auth middleware (T1, T6)
2. **Phase 2: Frontend Auth Layer** — AuthContext, api.js, LoginPage, ProtectedRoute (T2, T4, T5, D3)
3. **Phase 3: Sessions & Password Reset** — Refresh tokens, silent refresh, password reset emails, role-based UI (T3, T7)
4. **Phase 4: Admin User Management** — Admin-only CRUD for users, role assignment, deactivation (T9)

## Deployment Decision Needed

The Express backend deployment approach (Vercel serverless functions vs standalone server) cascades into database choice, CORS config, and project structure. This must be decided before any backend code is written.

## Gaps to Resolve During Planning

1. Vercel cookie domain management between SPA and serverless function
2. Email provider choice for password reset (nodemailer vs resend)
3. Whether v1 needs a token revocation mechanism beyond short expiry
4. Rate limiting threshold validation for factory floor usage patterns

*Research synthesized: 2026-06-15*
