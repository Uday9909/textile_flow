# Testing Patterns

**Analysis Date:** 2026-06-15

## Test Framework

**Not present.** No test runner is installed or configured in this project.

The `package.json` includes no test-related dependencies:
- No `vitest`, `jest`, `mocha`, `playwright`, `cypress`, `testing-library`, or any other test framework
- No `test` script defined in `package.json` scripts
- No test configuration files (`vitest.config.*`, `jest.config.*`, `.mocharc.*`)

**Run Commands:**
```bash
npm run dev       # Development server only
npm run build     # Build for production
npm run lint      # ESLint check only
npm run preview   # Preview production build
```

## Test File Organization

**No test files exist.** There are zero files matching `*.test.*`, `*.spec.*`, or any test-related naming convention anywhere in the `src/` directory.

## Test Structure

Not applicable — no tests exist.

## Mocking

Not applicable — no test setup exists.

## Fixtures and Factories

**Test data exists but is not used for testing.** The file `src/data/mockData.js` contains extensive mock data that serves as the application's data layer at runtime:

- `INITIAL_LOTS` — 6 sample lots with various stages and priorities
- `WORKFLOW_TEMPLATES` — 3 workflow templates
- `STAGE_POOL` — 14 processing stages with metadata
- `PARTIES` — 6 sample party names
- `FABRIC_TYPES` — 12 fabric types
- `PARTY_RATES` — Contract rate overrides for specific parties
- `DEFAULT_RATES` — Standard process rates in INR/kg
- `DEPT_CAPACITY` — Per-department processing capacity limits

**Helper utilities in `src/data/mockData.js`:**
- `generateId()` — Creates unique lot IDs
- `generateLotNumber()` — Sequential lot number generator
- `calculateCharges(lot)` — Computes job charges for a lot
- `getRate(partyName, stageId)` — Looks up rate with contract override
- `getStageById(id)` — Stage metadata lookup
- `hoursAgo(h)` / `minsAgo(m)` — Past timestamp generators (used inline during module initialization)

These mock data functions and constants are used directly by the application at runtime (there is no backend). They serve as the de facto data layer.

## Coverage

**Not enforced.** No coverage tooling exists. No coverage thresholds are configured.

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present.

## What Would Need Testing

Based on the application's architecture, the following areas have identifiable test surface:

**Critical paths (no test coverage):**
- `AppContext` reducer (`appReducer`) — all action handlers (`CREATE_LOT`, `START_STAGE`, `COMPLETE_STAGE`, `UNDO_COMPLETE`, `SET_OPERATOR`, etc.)
- `checkAutoEscalation()` — auto-escalation logic
- State persistence (`loadState`) — localStorage read/write
- Cross-tab sync via `BroadcastChannel`
- Form validation in `CreateLot.jsx`
- Data utility functions in `mockData.js` (`calculateCharges`, `getRate`, `getStageById`)
- Sort/filter logic in `DepartmentQueue.jsx` and `SupervisorDashboard.jsx`

**Setup needed to add tests:**
1. Install a test runner (recommended: `vitest` as it integrates with Vite)
2. Install `@testing-library/react` for component testing
3. Install `@testing-library/jest-dom` for DOM assertions
4. Create `vitest.config.js` extending `vite.config.js`
5. Add test script to `package.json`

---

*Testing analysis: 2026-06-15*
