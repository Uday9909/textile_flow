# Roadmap: TextileFlow MES

**Created:** 2026-06-15
**Phase Count:** 4
**v1 Requirements:** 14 of 14 mapped ✓

## Progress

| # | Phase | Status | Plans | Progress |
|---|-------|--------|-------|----------|
| 1 | Auth Foundation | ○ Planning | 2/2 | 0% |
| 2 | Role Enforcement & Password Reset | ◆ Complete | 3/3 | 100% |
| 3 | WhatsApp Notifications | ○ Pending | 0/0 | 0% |
| 4 | Inbound WhatsApp & OCR Scanning | ○ Pending | 0/0 | 0% |

## Phases

### Phase 1: Auth Foundation
**Goal:** Express backend with login/logout, JWT sessions, persistent sessions, frontend route protection, and login page
**Mode:** mvp
**Success Criteria:**
1. Express server runs and responds to `/api/auth/*` endpoints
2. User can log in on the login page with email/password using JWT and is redirected to the application
3. User can click log out from the application and their session is terminated (token cleared)
4. User stays logged in after page refresh without needing to re-enter credentials
5. Unauthenticated users attempting to navigate to any protected page are redirected to the login page

**Requirements:**
- AUTH-01: Backend Express server with user authentication API
- AUTH-02: User can log in with email and password (JWT session)
- AUTH-03: User can log out and clear session
- AUTH-04: User session persists across page refresh
- AUTH-07: Unauthenticated users are redirected to login page

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Express backend + SQLite DB + JWT auth API (login/refresh/logout/me)
- [ ] 01-02-PLAN.md — AuthContext + LoginPage + ProtectedRoute + App.jsx wiring

### Phase 2: Role Enforcement & Password Reset
**Goal:** Three-role access control (Operator, Supervisor, Admin), role-based route protection, and password reset flow
**Mode:** mvp
**Success Criteria:**
1. User can request a password reset via their email, receive a reset link, and set a new password
2. An Operator user sees only department queue pages and not Admin-only pages
3. A Supervisor user sees all queues and the dashboard but cannot access Admin user management
4. An Admin user sees all features including the admin panel
5. Backend API endpoints reject requests that the user's role is not authorized for (403)

**Requirements:**
- AUTH-05: User can reset password via email link
- AUTH-06: System enforces three roles — Operator, Supervisor, Admin
- AUTH-08: Users can only access pages their role permits

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Backend role middleware (authorize) + password reset API endpoints
- [x] 02-02-PLAN.md — Frontend role-based route protection + role-filtered sidebar
- [x] 02-03-PLAN.md — Frontend password reset pages (ForgotPassword + ResetPassword)

### Phase 3: WhatsApp Notifications
**Goal:** WhatsApp Business API integration with automatic notifications to parties on lot arrival and dispatch
**Mode:** mvp
**Success Criteria:**
1. WhatsApp Business API integration is configured, authenticated, and able to send messages
2. Party receives a WhatsApp message with the lot quantity when their lot enters the factory
3. Party receives a WhatsApp message with the lot quantity when their lot is dispatched

**Requirements:**
- WHATS-01: WhatsApp Business API integration configured
- WHATS-02: Party receives WhatsApp when their lot enters factory (with quantity)
- WHATS-03: Party receives WhatsApp when their lot is dispatched (with quantity)

### Phase 4: Inbound WhatsApp & OCR Scanning
**Goal:** On-demand lot status via WhatsApp and OCR scanning of challan documents
**Mode:** mvp
**Success Criteria:**
1. Party can send a WhatsApp message to check current lot quantity and receive an automated reply
2. Operator can upload or scan a challan document at the lot receiving stage
3. System automatically extracts lot data (quantity, party name) from the scanned challan

**Requirements:**
- WHATS-04: Party can text WhatsApp to check current quantity of their product in factory
- OCR-01: Operator can upload/scan challan document at lot receiving
- OCR-02: System extracts lot data (quantity, party name) from scanned challan

## Dependency Graph

```
Phase 1 (Auth Foundation)
  ├── Phase 2 (Roles & Password Reset)
  └── Phase 3 (WhatsApp Notifications)
        └── Phase 4 (Inbound WhatsApp & OCR)
```

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 2 | Complete |
| WHATS-01 | Phase 3 | Pending |
| WHATS-02 | Phase 3 | Pending |
| WHATS-03 | Phase 3 | Pending |
| WHATS-04 | Phase 4 | Pending |
| OCR-01 | Phase 4 | Pending |
| OCR-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Roadmap created: 2026-06-15*
