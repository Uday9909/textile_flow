# Domain Pitfalls: Authentication

**Domain:** Authentication for React SPA + Express Backend (TextileFlow MES)
**Researched:** 2026-06-15

## Critical Pitfalls

### 1. Storing JWTs in localStorage (XSS-Exposed Credentials)

**What goes wrong:** JWT stored in `localStorage` — any XSS vulnerability gives attacker `localStorage.getItem('token')`. No server-side revocation possible with stateless JWTs.

**Fix:** Use httpOnly, Secure, SameSite=Strict cookies for refresh tokens. Store access token in memory only. If localStorage is necessary (no SSR), accept the risk with short token expiry.

**Phase:** Phase 1 — must decide before any auth endpoint is built.

### 2. No Refresh Token Rotation or Short-Lived Access Tokens

**What goes wrong:** Long-lived access tokens (hours/days) with no refresh mechanism. Leaked token has massive exposure window. Non-rotated refresh tokens grant indefinite access.

**Fix:** Access tokens: 10-15 minutes max. Refresh tokens: 7 days with rotation. Store refresh token hash server-side for revocation.

**Phase:** Phase 1 (AUTH-02)

### 3. Algorithm Confusion Attack on JWT Verification

**What goes wrong:** JWT verification accepts token's `alg` header without pinning. Attacker crafts token with `alg: "none"` and bypasses authentication.

**Fix:** Always pin algorithm in `jwt.verify()`: `{ algorithms: ['RS256'] }`. Use asymmetric signing (RS256/ES256).

**Phase:** Phase 2 (auth middleware)

### 4. CORS Misconfiguration

**What goes wrong:** Permissive CORS (`origin: *` with credentials, or reflective origin) allows attacker sites to make authenticated requests.

**Fix:** Narrow origin whitelist for production. Use environment-specific CORS configs. If Express runs on same Vercel domain, CORS may not be needed.

**Phase:** Phase 2 (AUTH-05)

### 5. Password Storage Without Proper Hashing

**What goes wrong:** Plaintext, SHA, or low-round bcrypt. Database breach leaks recoverable passwords.

**Fix:** bcrypt with 10-12 salt rounds. Never roll your own. Never use fast hashes (MD5, SHA-1/256).

**Phase:** Phase 1 (AUTH-01)

### 6. Client-Side-Only Role Gating

**What goes wrong:** Role checks only in React frontend, not in Express middleware. Users can escalate to admin by calling APIs directly or manipulating localStorage.

**Fix:** Two-layer enforcement: Express middleware for authority, React guards for UX only. Backend is authoritative.

**Phase:** Phase 2

### 7. No CSRF Protection with Cookie Auth

**What goes wrong:** If using httpOnly cookies (recommended), the app is vulnerable to CSRF unless SameSite is set.

**Fix:** `SameSite=Strict` on auth cookies. Or require custom header (`X-Requested-With`).

**Phase:** Phase 2

### 8. Missing Rate Limiting on Auth Endpoints

**What goes wrong:** No rate limiting on login/password-reset. Brute-force and email enumeration possible.

**Fix:** `express-rate-limit` on auth routes (5 attempts / 15 min for login).

**Phase:** Phase 2

## Moderate Pitfalls

| Pitfall | Fix |
|---------|-----|
| Password reset token without expiration | 15-30 min max, single-use, crypto-random |
| JWT secret hardcoded in source | Environment variables, `.env` not committed |
| CORS allowing localhost in production | Environment-specific CORS configs |
| No token revocation mechanism | Per-user token version counter in DB |
| Error messages leaking auth state | Generic "Invalid email or password" for all failures |

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Express setup + user model | Password stored with SHA instead of bcrypt | Install bcrypt before writing user model |
| Phase 1: JWT login endpoint | Token in localStorage, no refresh | Commit to cookie strategy early |
| Phase 2: Role-based middleware | Client-side-only role gating persists | Write Express role middleware first |
| Phase 2: Login page + logout | CORS misconfiguration | Set production origin whitelist before deploying |
| Phase 2: Persistent sessions | Refresh token in localStorage | Use httpOnly cookie |
| Phase 2: Route protection | Frontend checks exp claim instead of catching 401s | Implement 401 intercept → redirect to login |
| Vercel deployment | CORS issues, cold starts, cookie domain mismatch | Test on Vercel preview before production |
| Password reset | Long-lived/resuable reset tokens | 15-min expiry, single-use, hash stored token |

*Pitfalls research: 2026-06-15*
