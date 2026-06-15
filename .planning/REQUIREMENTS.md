# Requirements: TextileFlow MES

**Defined:** 2026-06-15
**Core Value:** Operators can reliably track and move lots through production stages, and supervisors have visibility into factory floor status.

## v1 Requirements

Requirements for initial milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Backend Express server with user authentication API
- [ ] **AUTH-02**: User can log in with email and password (JWT session)
- [ ] **AUTH-03**: User can log out and clear session
- [ ] **AUTH-04**: User session persists across page refresh
- [ ] **AUTH-05**: User can reset password via email link
- [ ] **AUTH-06**: System enforces three roles — Operator, Supervisor, Admin
- [ ] **AUTH-07**: Unauthenticated users are redirected to login page
- [ ] **AUTH-08**: Users can only access pages their role permits

### WhatsApp Notifications

- [ ] **WHATS-01**: WhatsApp Business API integration configured
- [ ] **WHATS-02**: Party receives WhatsApp when their lot enters factory (with quantity)
- [ ] **WHATS-03**: Party receives WhatsApp when their lot is dispatched (with quantity)
- [ ] **WHATS-04**: Party can text WhatsApp to check current quantity of their product in factory

### OCR Scanning

- [ ] **OCR-01**: Operator can upload/scan challan document at lot receiving
- [ ] **OCR-02**: System extracts lot data (quantity, party name) from scanned challan

## v2 Requirements

Deferred to future releases.

### Session Management

- **AUTH-09**: Admin user management UI (create/edit/deactivate users)
- **AUTH-10**: Session idle timeout with warning dialog

### Communication

- **WHATS-05**: Configurable WhatsApp message templates per party
- **WHATS-06**: Scheduled WhatsApp reports (daily production summary)

### OCR

- **OCR-03**: Auto-scan lot tags/labels at each stage transition
- **OCR-04**: OCR training/correction workflow for improved accuracy

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth/SSO login | Not needed for factory floor context; email/password sufficient |
| User self-registration | Admins create users; no public signup |
| Multi-factor authentication | MFA adds friction without value for internal factory tool |
| Mobile app | Web-first; WhatsApp handles mobile notifications |
| CAPTCHA | Rate limiting sufficient for controlled network |
| Password expiry policy | NIST recommends against periodic rotation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 2 | Pending |
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
*Requirements defined: 2026-06-15*
*Last updated: 2026-06-15 after initial definition*
