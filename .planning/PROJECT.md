# TextileFlow MES

## What This Is

A manufacturing execution system (MES) for textile factory floors — tracks production lots through stages (Grey → Bleaching → Dyeing → Finishing → Dispatch), manages department queues, and provides supervisor oversight. Currently a fully client-side SPA built with React.

## Core Value

Operators can reliably track and move lots through production stages, and supervisors have visibility into factory floor status.

## Requirements

### Validated

- ✓ Lot creation with workflow templates and custom workflow builder — existing
- ✓ Stage progression (start stage, complete stage, undo completion) — existing
- ✓ Department queue views (in-process, waiting, completed today) — existing
- ✓ Dispatch page with process checklist and job charges — existing
- ✓ Supervisor dashboard with factory floor overview, lot search, summary stats — existing
- ✓ AI panel with delay detection and department performance charts — existing
- ✓ Production history with timeline view and CSV export — existing
- ✓ Cross-tab state synchronization via BroadcastChannel — existing
- ✓ localStorage persistence of application state — existing
- ✓ Dark theme design system — existing
- ✓ Basic client-side role gating (admin vs department operator) — existing

### Active

- [ ] **AUTH-01**: Backend Express server with user authentication API
- [ ] **AUTH-02**: Email/password login with JWT session management
- [ ] **AUTH-03**: Password reset via email link
- [ ] **AUTH-04**: Three roles with route-level access control (Operator, Supervisor, Admin)
- [ ] **AUTH-05**: Login page and logout functionality
- [ ] **AUTH-06**: Persistent sessions across page refresh
- [ ] **AUTH-07**: Frontend route protection based on auth state and role

- [ ] **WHATS-01**: WhatsApp Business API integration for party notifications
- [ ] **WHATS-02**: Automatic WhatsApp message to party when their lot enters factory (with quantity)
- [ ] **WHATS-03**: Automatic WhatsApp message to party when their lot is dispatched (with quantity)
- [ ] **WHATS-04**: Party can text WhatsApp to check current quantity of their product in factory
- [ ] **OCR-01**: OCR scanning of incoming challan/invoice documents at lot receiving
- [ ] **OCR-02**: Auto-extract lot data (quantity, party name, etc.) from scanned challans

### Out of Scope

- OAuth/SSO login (Google, GitHub) — defer to future milestone
- User registration/self-signup — admins create users directly
- Email verification flow — password reset is sufficient for v1
- Multi-factor authentication — not needed for factory floor context
- Backend beyond auth (no lot CRUD API, no real database) — auth-only backend for now

## Context

This is a brownfield project — an existing client-side React SPA for textile manufacturing floor management. The codebase is pure JavaScript (no TypeScript), uses Vite 8 as build tool, and has zero test infrastructure. All data is mock data with localStorage persistence.

The immediate goal is to add three major capabilities:
1. **Authentication**: An Express.js backend with JWT auth, login/logout, password reset, and role-based access (Operator, Supervisor, Admin)
2. **WhatsApp Notifications**: WhatsApp Business API integration to notify parties when lots arrive and are dispatched, plus on-demand quantity lookup via WhatsApp
3. **OCR Scanning**: OCR for challan/invoice documents at lot receiving to auto-extract data

The app is deployed on Vercel, which may influence how the Express backend is deployed (serverless functions on Vercel, or a separate server).

## Constraints

- **Tech Stack**: Express backend must integrate with existing React + Vite frontend
- **Architecture**: Backend expands to handle auth, WhatsApp integration, and OCR — existing mock data and localStorage state remain unchanged initially
- **WhatsApp**: Requires WhatsApp Business API setup (Twilio or Meta API) — not yet configured
- **OCR**: Requires an OCR library or service (Tesseract.js or cloud API) for document scanning
- **Deployment**: Vercel deployment will need to accommodate the Express backend (serverless functions or separate hosting)
- **Compatibility**: Auth changes must not break existing lot management functionality
- **No TypeScript**: Both frontend and backend remain JavaScript for now
- **No Tests**: No test infrastructure exists yet — adding tests is optional for this phase

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Express + Node.js backend | Matches existing JavaScript stack, straightforward integration with React frontend | — Pending |
| Email/password only (no OAuth) | Simplest auth for factory floor context, OAuth can be added later | — Pending |
| Operator + Supervisor + Admin roles | Three tiers match factory hierarchy: floor operators, shift supervisors, plant admins | — Pending |
| JWT sessions | Stateless auth, standard for SPA + REST API architecture | — Pending |
| Password reset (no email verification) | Practical for v1 — operators need recovery, full verification is lower priority | — Pending |
| Backend is auth-only for now | Minimal backend scope — no lot CRUD or real database until later phases | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-15 after initialization*
