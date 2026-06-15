# Feature Landscape: Authentication for React SPA + Express Backend

**Domain:** Authentication system for React SPA with Express.js REST API backend
**Context:** TextileFlow MES — brownfield factory floor management SPA
**Researched:** 2026-06-15
**Overall confidence:** HIGH (well-documented domain with stable patterns)

## Table Stakes

Features users expect. Missing any makes the auth system feel broken.

### T1: Email/Password Login
**Complexity:** Low
- Frontend: Login form POST to `/api/auth/login`
- Backend: Express route validates credentials, returns JWT
- On success: Store token, redirect to app
- Use bcrypt for password hashing, return JWT in response body

### T2: Logout
**Complexity:** Low
- Frontend: Clears stored token, redirects to login
- Backend: Optional token blacklist (for shared terminal security)
- Stateless JWT logout means old tokens valid until expiry — short expiry mitigates this

### T3: Persistent Sessions Across Page Refresh
**Complexity:** Medium
- Access token (short-lived, 15-30 min) in memory
- Refresh token (longer-lived, 7 days) in httpOnly cookie
- On page load: Check existing token, silent refresh via `/api/auth/refresh`
- On refresh expiry: Redirect to login

### T4: Login Page
**Complexity:** Low
- Route: `/login`, redirect unauthenticated users here
- Show error messages inline, redirect to intended URL on success

### T5: Frontend Route Protection
**Complexity:** Low-Medium
- `ProtectedRoute` wrapper component
- Check auth state before rendering, redirect to `/login` if unauthenticated
- Show 403 page if authenticated but wrong role

### T6: Backend Route Protection (Auth Middleware)
**Complexity:** Low
- `authenticate` middleware: extract JWT from `Authorization: Bearer <token>`, verify, attach `req.user`
- `authorize(...roles)` middleware: check `req.user.role` against allowed roles, return 403
- Public routes: login and password-reset only

### T7: Password Reset Flow
**Complexity:** Medium-High (email delivery setup)
- User requests reset via `/api/auth/forgot-password`
- Backend generates short-lived reset token, sends email with link
- Frontend shows reset form, POSTs new password + token to `/api/auth/reset-password`
- Token is single-use with expiration

### T8: Role-Based Access Control (Three Roles)
**Complexity:** Medium
- **Operator:** Department queue, stage management (no admin panel)
- **Supervisor:** All queues, dashboard, reports, override (cannot manage users)
- **Admin:** Full access — user management, role assignment, all data views
- JWT payload includes `role` field, enforced by Express middleware

### T9: User Management (Admin Creates Users)
**Complexity:** Medium
- Admin-only route: `/admin/users`
- Create user form: name, email, password, role selection
- No delete — deactivate users to preserve audit trail
- Admin-initiated password reset

## Differentiators

Features beyond the baseline (defer to post-MVP).

| Feature | Complexity | Value |
|---------|------------|-------|
| D1: Session timeout with idle warning | Medium | Prevents unauthorized access on shared terminals |
| D2: Concurrent session detection | High | Audit concern for credential sharing |
| D3: Rate limiting on login | Low | Prevents brute-force (express-rate-limit) |
| D4: Audit logging for auth events | Low-Medium | Compliance value |
| D5: "Remember Me" on login | Low | Extended session duration |
| D6: Account lockout after failed attempts | Medium | Brute-force prevention |

## Anti-Features

Do NOT build for this project.

| Feature | Why Exclude |
|---------|-------------|
| Self-registration / sign-up | Project explicitly excludes; admins provision users |
| OAuth/SSO (Google, GitHub) | Factory network, no internet-facing SSO |
| Multi-factor authentication | Inappropriate UX friction for factory operators |
| Social login | Irrelevant to factory floor MES |
| Email verification | No benefit when admins create users directly |
| Session dashboard for regular users | Overkill for operators with one terminal |
| Password expiry/rotation | NIST recommends against periodic rotation |
| CAPTCHA on login | Rate limiting + lockout are sufficient |

## MVP Recommendation

Build order for v1:

1. **T1 (Email/Password Login)** — foundational
2. **T2 (Logout)** — immediate need for shared terminals
3. **T4 (Login Page)** — the UI entry point
4. **T6 (Backend Auth Middleware)** — server-side protection
5. **T5 (Frontend Route Protection)** — prevents unauthorized access
6. **T8 (Role-Based Access Control)** — three roles requirement
7. **T3 (Persistent Sessions)** — acceptable UX
8. **T7 (Password Reset)** — core requirement (AUTH-03)

**Defer:**
- **T9 (User Management):** Can be admin-only seeding
- **D1-D6 (All differentiators):** Add after core auth is stable
- **A1-A8 (Anti-features):** Do not build

*Features research: 2026-06-15*
