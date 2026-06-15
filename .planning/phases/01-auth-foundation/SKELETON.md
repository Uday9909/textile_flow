# Walking Skeleton — TextileFlow MES

**Phase:** 1
**Generated:** 2026-06-15

## Capability Proven End-to-End

A user can open the application, see a login page, enter their email and password, access the main factory floor application, refresh the browser without losing their session, and log out to return to the login page.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | Express 4.21+ | Matches existing JS stack; minimal, well-understood; no TypeScript dependency |
| JWT library | jose 5.x | Modern Web Crypto API; no native compilation needed; actively maintained; replaces jsonwebtoken |
| Password hashing | bcryptjs (pure JS) | Works in serverless environments; no native compilation (bcrypt fails in CI/Vercel) |
| Auth middleware | Custom (no Passport.js) | 5-endpoint auth API does not justify Passport.js abstraction overhead |
| Database (dev) | SQLite via better-sqlite3 | Zero-config, file-based, no server process; Vercel Postgres deferred to production |
| Token storage | Access token in memory; refresh token in httpOnly Secure SameSite=Strict cookie | OWASP-recommended; mitigates XSS token theft; no localStorage for JWTs |
| Frontend auth | Dedicated AuthContext (separate from AppContext) | Different lifecycle (token refresh, 401 interception), persistence, and security concerns |
| Frontend HTTP | Native fetch (no axios) | 4-5 auth endpoints do not justify axios bundle weight |
| Backend deployment | Local `npm run dev` concurrently; Vercel serverless function architecture deferred | Simplest development setup; production deployment decision deferred to milestone completion |
| Root project | Single `package.json` with `concurrently` for `npm run dev` | One command starts both frontend (Vite) and backend (Express); no monorepo tooling |

## Stack Touched in Phase 1

- [x] Project scaffold — `server/` directory with Express setup, `package.json` scripts for concurrent dev
- [x] Routing — `/login` route (public), all existing routes (protected via ProtectedRoute)
- [x] Database — SQLite with `users` table: seed on first run, read on login
- [x] UI — LoginPage with email/password form wired to POST /api/auth/login
- [x] Deployment — `npm run dev` from project root starts both Vite frontend and Express backend

## Out of Scope (Deferred to Later Slices)

- Role-based route access control (Operator/Supervisor/Admin) — Phase 2
- Password reset via email — Phase 2
- Admin user management UI (create/edit/deactivate users) — Phase 2
- Backend beyond auth (no lot CRUD API, no real database for lots) — stays client-side
- Test infrastructure — added when backend expands in Phase 2
- Production deployment (Vercel serverless vs standalone server) — decided at milestone boundary

## Subsequent Slice Plan

- Phase 2: Role Enforcement and Password Reset — three roles, role middleware, password reset flow, admin user management
- Phase 3: WhatsApp Notifications — WhatsApp Business API integration for party messaging
- Phase 4: Inbound WhatsApp and OCR Scanning — on-demand lot status, challan document OCR

---

*Skeleton recorded: 2026-06-15*
