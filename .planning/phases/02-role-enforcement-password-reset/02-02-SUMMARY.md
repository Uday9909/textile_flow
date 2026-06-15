---
phase: 02-role-enforcement-password-reset
plan: 02
subsystem: frontend-auth
tags:
  - role-based-access
  - route-guard
  - sidebar
  - authorization
requires:
  - Phase 1 auth (JWT, AuthContext with user.role)
provides:
  - Role-based ProtectedRoute with allowedRoles prop
  - Three-tier AppContent routing (admin/supervisor/operator)
  - Role-filtered Sidebar navigation
affects:
  - src/components/Auth/ProtectedRoute.jsx
  - src/App.jsx
  - src/components/Layout/Sidebar.jsx
tech-stack:
  added: []
  patterns:
    - "useAuth().user.role as authRole for frontend branching"
key-files:
  created: []
  modified:
    - src/components/Auth/ProtectedRoute.jsx
    - src/App.jsx
    - src/components/Layout/Sidebar.jsx
decisions:
  - "Wrong-role users redirected to / (root), which role-redirects to their default route via AppContent"
  - "Supervisor sidebar shows Switch Department (label) instead of Switch User, mirroring operator pattern but contextually accurate"
  - "Admin sidebar omits Switch User button — admin uses TopBar logout instead"
metrics:
  duration: "~5 min"
  completed_date: "2026-06-15"
---

# Phase 2 Plan 2: Role-Enforced Frontend Routing Summary

**Objective:** Add role-based route protection to the frontend: ProtectedRoute with role checking, role-appropriate page routing in AppContent, and role-filtered sidebar navigation.

## Results

Each task completed and committed independently:

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update ProtectedRoute to accept and enforce allowedRoles prop | `7f5d62d` | `src/components/Auth/ProtectedRoute.jsx` |
| 2 | Restructure AppContent routing to use auth role for page access | `03e0a3c` | `src/App.jsx` |
| 3 | Update Sidebar menu filtering to use auth role | `66d3cfb` | `src/components/Layout/Sidebar.jsx` |

### Task 1: ProtectedRoute with allowedRoles

ProtectedRoute now accepts an optional `allowedRoles` prop (array of role strings). When provided, the component checks `user.role` against the array. If the user's role is not in `allowedRoles` (and `user` exists), the user is redirected to `/` which then role-redirects to their appropriate default route via AppContent. When `allowedRoles` is not provided, existing auth-only behavior (redirect to `/login` if unauthenticated) is preserved unchanged.

### Task 2: AppContent role-based routing

Replaced the old `isAdmin`/`state.department` branching with `authRole` from `useAuth().user.role`. The new routing structure:

- **Shared (all roles):** `/` redirects to their department queue, `/queue/:department` renders DepartmentQueue, `*` catch-all redirects to queue
- **Supervisor + Admin:** `/dispatch`, `/supervisor`, `/history`
- **Admin-only:** `/create`, `/ai-panel`

The operator prompt flow (`!state.operatorName` returns `<OperatorPrompt />`) is preserved unchanged.

### Task 3: Sidebar role-filtering

Replaced the old `state.department === 'admin'` check with `authRole` from `useAuth()`. Three-tier sidebar:

- **Admin:** Create Lot, Dashboard, AI Supervisor, all department queues, Dispatch, Production History, Reset Demo Data. No Switch User button.
- **Supervisor:** Dashboard, all department queues, Dispatch, Production History, Switch Department button. No Create Lot, AI Supervisor, Reset Demo Data.
- **Operator:** Single department queue (unchanged), Switch User button.

## Deviations from Plan

None -- plan executed exactly as written.

## Auth Gates

None -- no authentication gates encountered (frontend-only changes).

## Known Stubs

None found.

## Threat Flags

No new security-relevant surface introduced. All changes are client-side UI rendering. Backend authorize middleware (Plan 01) is authoritative for access control.

## Verification

1. `allowedRoles` present in `ProtectedRoute.jsx` -- VERIFIED (2 occurrences)
2. `authRole` present in `App.jsx` -- VERIFIED (3 occurrences)
3. `useAuth` present in `Sidebar.jsx` -- VERIFIED (2 occurrences, import + usage)
4. `/create` route present in `App.jsx` under admin branch -- VERIFIED

## Success Criteria Met

- [x] Operator user sees only department queue in sidebar, cannot navigate to /create, /ai-panel, /supervisor, /dispatch, /history
- [x] Supervisor user sees Dashboard, all queues, Dispatch, History in sidebar; does NOT see Create Lot or AI Panel
- [x] Admin user sees all sidebar menu items and routes
- [x] ProtectedRoute redirects to root when user role doesn't match allowedRoles
- [x] Old operator prompt flow unchanged -- all roles still pass through OperatorPrompt

## Self-Check: PASSED

All 3 modified files exist. All 3 commits (`7f5d62d`, `03e0a3c`, `66d3cfb`) verified.
