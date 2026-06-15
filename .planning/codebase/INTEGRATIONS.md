# External Integrations

**Analysis Date:** 2026-06-15
**Focus:** External APIs, databases, auth providers, webhooks

## Overview

This is a **fully client-side SPA** with no backend server. All data is mock data with localStorage persistence. There are zero external API calls at runtime.

## External Services

### Runtime Dependencies

| Service | Type | Usage |
|---------|------|-------|
| Google Fonts (Inter) | CSS font resource | Loaded via `@import url()` in `src/index.css` |

### No External APIs

The application makes **zero** calls to external APIs at runtime:
- No REST endpoints
- No GraphQL endpoints
- No WebSocket connections
- No third-party API integrations

## Data Storage

| Store | Type | Details |
|-------|------|---------|
| localStorage | Browser key-value store | Full application state serialized via `JSON.stringify` on every reducer dispatch |
| Mock data | In-memory | `src/data/mockData.js` — initial seed data and default templates |

**Limitations:**
- localStorage quota (~5–10MB) insufficient for production data volumes
- Synchronous serialization blocks the main thread
- Data loss if user clears browser storage
- No cross-device or multi-machine coordination

## Authentication

**No authentication system.** The operator name/role selector is a client-side UI prompt with localStorage persistence. Any user can set any role (including admin) by editing localStorage — no server-side enforcement.

## Cross-Tab Communication

| Mechanism | Purpose |
|-----------|---------|
| BroadcastChannel API | Synchronize state across browser tabs |

**Caveat:** Uses full-state replacement (`SYNC_STATE` action), which can cause concurrent edit conflicts.

## Hosting & Deployment

| Platform | Details |
|----------|---------|
| Vercel | Configured via `vercel.json` with SPA rewrites rule |
| Project ID | Set in `.vercel/project.json` |

## Monitoring & Error Reporting

**None detected.** No error monitoring (Sentry, Datadog, etc.), no analytics, no logging service.

## Webhooks

**None.** No webhook endpoints or integrations.

*Integrations audit: 2026-06-15*
