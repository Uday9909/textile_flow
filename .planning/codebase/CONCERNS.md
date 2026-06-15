# Codebase Concerns

**Analysis Date:** 2026-06-15

## Tech Debt

### Missing `icon` property in STAGE_POOL data model

**Issue:** Multiple components reference `stage?.icon` and `stageInfo?.icon` (in `src/pages/Dispatch.jsx:153`, `src/pages/AIPanel.jsx:162`, `src/pages/SupervisorDashboard.jsx:157`, `src/pages/ProductionHistory.jsx:179,235`, and others), but the `STAGE_POOL` array in `src/data/mockData.js:6-21` has no `icon` field. Each stage object only contains `{ id, name, accent, expectedHours }`. The optional chaining prevents crashes, but all icon references silently render nothing.

**Files:**
- `src/data/mockData.js` (lines 6-21) — data source lacking `icon` field
- `src/pages/Dispatch.jsx` (line 153)
- `src/pages/AIPanel.jsx` (line 162)
- `src/pages/SupervisorDashboard.jsx` (line 157)
- `src/pages/ProductionHistory.jsx` (lines 179, 235)

**Impact:** Visual — users see empty space before stage names in dispatch checklist, AI panel analysis, supervisor search results, and production history timelines. No error is thrown, but the UI appears broken/incomplete.

**Fix approach:** Either add an `icon` property (e.g. a Lucide icon name string) to every entry in `STAGE_POOL` and render the corresponding component, or remove all `stage?.icon` references from the JSX.

---

### All data is in-memory with localStorage persistence

**Issue:** The entire application state lives in a single `useReducer` in `src/context/AppContext.jsx`, persisted to `localStorage` via `JSON.stringify` on every state change. There is no backend server, no API layer, no database. The `localStorage` quota (~5-10MB) will be exceeded with realistic production data volumes. JSON serialization/deserialization on every state change is wasteful for large lot counts. `localStorage` is synchronous and blocks the main thread.

**Files:** `src/context/AppContext.jsx` (lines 15-25, 282-309), `src/data/mockData.js`

**Impact:** Cannot scale to a real factory floor. Data loss if localStorage is cleared. No multi-machine coordination beyond BroadcastChannel (same browser only). No real data durability.

**Fix approach:** Introduce a backend API layer (REST or WebSocket) backed by a database. State should be persisted server-side with localStorage as an offline cache only.

---

### No TypeScript in a state management-heavy application

**Issue:** The application uses plain `.jsx` files with no type checking. The state shape in `src/context/AppContext.jsx` is complex (lots with stage histories, notifications with timestamps, undo actions with expiry) and is manipulated through stringly-typed action types. No compile-time verification exists that action payloads match reducer expectations. A typo like `'COMPLETE_STAGE'` vs `'COMPLETE_LOT'` silently falls through to the `default` case.

**Files:** All `.jsx` files in `src/`

**Impact:** Runtime errors from mismatched data shapes, harder to refactor, no IDE autocomplete for state access. The reducer's `default: return state` means invalid actions are silently swallowed, making bugs hard to trace.

**Fix approach:** Migrate to TypeScript. Define explicit types for Lot, StageHistoryItem, Notification, WorkflowTemplate, and the Redux-style action union.

---

### Duplicate delay-detection logic across four locations

**Issue:** The same logic for calculating whether a lot is delayed (compare elapsed hours vs `expectedHours` from stage info) is duplicated nearly identically in:
1. `src/pages/AIPanel.jsx` (lines 26-35) — full analysis
2. `src/pages/SupervisorDashboard.jsx` (lines 72-83) — delay count
3. `src/components/Queue/InProcessCard.jsx` (lines 37-40) — per-card display
4. `src/components/Queue/WaitingCard.jsx` (lines 25-26) — waiting escalation

Each copy differs slightly in threshold values and data sources. Some use `expectedHours` directly, some default to `2` when undefined. Some check `startTime`, some check `waitingSince`. This creates inconsistent delay indicators across the app.

**Files:** `src/pages/AIPanel.jsx`, `src/pages/SupervisorDashboard.jsx`, `src/components/Queue/InProcessCard.jsx`, `src/components/Queue/WaitingCard.jsx`

**Impact:** A lot may show as "On Track" in one view and "Delayed" in another. The escalation threshold in the queue (4x expected) differs from the AI panel (3x for escalation button), confusing operators.

**Fix approach:** Extract a single `isLotDelayed(lot)` utility function in `src/data/mockData.js` or a new `src/utils/delayUtils.js` that centralizes the logic. Expose derived properties like `lot.statusEx === 'delayed'` from the context.

---

### No test infrastructure at all

**Issue:** There are zero test files, zero test configuration files (no `jest.config.*`, `vitest.config.*`, etc.), and no test scripts in `package.json`. The critical business logic in `appReducer` (lines 63-251 of `src/context/AppContext.jsx`) — which manages lot stage transitions, notifications, undo, and escalation — has no test coverage whatsoever.

**Files:** `package.json` (lines 6-11) — scripts section has only `dev`, `build`, `lint`, `preview`.

**Impact:** Regressions are guaranteed on any refactor. The reducer is the heart of the application and any change to stage transition logic (START_STAGE, COMPLETE_STAGE, UNDO_COMPLETE) is flying blind.

**Fix approach:** Add Vitest (already compatible with Vite). Write unit tests for the `appReducer` function, covering every action type. Add integration tests for the `getWaitingLots` sorting and `checkAutoEscalation` logic.

---

### Cross-tab BroadcastChannel race condition

**Issue:** `src/context/AppContext.jsx` (lines 260-309) uses `BroadcastChannel` for cross-tab state synchronization. The `SYNC_STATE` action replaces the entire state from another tab. A fast double-update from one tab can overwrite a concurrent update from another tab. The `isExternalUpdate` ref flag is used to prevent re-broadcasting, but this creates a window where local changes between receiving an external update and re-rendering are lost.

**Files:** `src/context/AppContext.jsx` (lines 258-309)

**Impact:** If two operators in different tabs complete stages simultaneously, one operator's action may be silently lost. The whole-state-replacement pattern means concurrent edits collide destructively.

**Fix approach:** Use a CRDT-based approach or at minimum an operation-based sync (send action type and payload to other tabs, re-dispatch locally) rather than whole-state replacement. Alternatively, designate a single "source of truth" tab.

---

### Revenue estimation uses proportional completion, not actual charges

**Issue:** `src/pages/SupervisorDashboard.jsx` (lines 47-58) calculates estimated revenue by taking each lot's total calculated charges and multiplying by `(completedStages.length / lot.stages.length)`. This assumes each stage has equal cost weight, which is false — `DEFAULT_RATES` values range from `1` (grey) to `12` (dyeing) with significant variation.

**Files:** `src/pages/SupervisorDashboard.jsx` (lines 47-58)

**Impact:** Revenue estimation is misleading. A lot that has completed only the "dyeing" stage (highest rate) but has 6 more low-rate stages remaining will show far less revenue than reality.

**Fix approach:** Calculate actual revenue from completed stage history using `calculateCharges` on the completed stages only, not amortized by stage count.

---

### Module-level mutable state for lot number counter

**Issue:** `src/data/mockData.js` (lines 283-286) uses a module-level `let lotCounter = 21118` and increments it with `generateLotNumber()`. This state is not persisted to localStorage and will reset to 21118 on page reload or HMR, causing duplicate lot numbers.

**Files:** `src/data/mockData.js` (lines 283-286)

**Impact:** Lot numbers collide after page refresh. A new lot created after reload gets number 21118, which may already exist in persisted state.

**Fix approach:** Read the next lot number from localStorage or derive it from the max existing lot number in state.

---

### Console.warn for all error handling

**Issue:** Every error path uses `console.warn()` (`src/context/AppContext.jsx` lines 22, 272, 295, 306). No error boundaries, no user-facing messages, no error reporting integration.

**Files:** `src/context/AppContext.jsx` (lines 22, 272, 295, 306)

**Impact:** Silent failures. localStorage quota exceeded, BroadcastChannel failure, or corrupted JSON state are logged to console that nobody reads.

**Fix approach:** Add a React error boundary component. Show toast notifications for recoverable errors. Integrate an error monitoring service.

---

## Known Bugs

### Dispatch page shows lots with incomplete dispatch stage

**Issue:** `src/pages/Dispatch.jsx` (lines 20-23) filters dispatchable lots using `completedStages >= lot.stages.length - 1 || lot.status === 'complete'`. A lot with status `'inprocess'` at its second-to-last stage appears dispatchable because N-1 stages are complete.

**Files:** `src/pages/Dispatch.jsx` (lines 20-25)

**Trigger:** Any lot that has completed N-1 stages but is still in-process at stage N.

**Workaround:** Navigate to the actual department queue to complete the final stage first.

---

### Sidebar mobile toggle uses fragile inline style override

**Issue:** `src/components/Layout/Sidebar.jsx` (line 56) sets `display: 'none'` on the mobile toggle button, then overrides it via a dynamically injected `<style>` tag at line 219-225. CSP or rendering conditions may block this.

**Files:** `src/components/Layout/Sidebar.jsx` (lines 41-59, 219-225)

**Symptoms:** Mobile sidebar toggle may remain hidden, making sidebar inaccessible on small screens.

---

### Custom Workflow Builder allows dispatch out of last position

**Issue:** `src/components/CreateLot/CustomWorkflowBuilder.jsx` does not lock "Dispatch" to the last position. If placed mid-workflow, `calculateCharges` skips charging for dispatch but routing logic breaks.

**Files:** `src/components/CreateLot/CustomWorkflowBuilder.jsx` (lines 56-88), `src/data/mockData.js` (lines 257-275)

---

## Security Considerations

### No authentication enforcement

**Risk:** Admin vs Department distinction is purely client-side (`src/App.jsx` lines 24-25). Any operator can change localStorage values to gain admin access.

**Files:** `src/App.jsx` (lines 24-49), `src/context/AppContext.jsx` (lines 219-229)

**Recommendations:** Server-side authentication (JWT/sessions). Backend API authorization.

---

### No input sanitization on free-text fields

**Risk:** Operator names (`src/components/Layout/OperatorPrompt.jsx`), party names, and colours (`src/pages/CreateLot.jsx`) are unsanitized. CSV export (`src/pages/ProductionHistory.jsx` lines 48-69) does not escape special characters.

---

## Performance Bottlenecks

### Full state JSON.stringify on every change

**File:** `src/context/AppContext.jsx` (line 293)

**Problem:** Synchronous full-state serialization on every reducer dispatch. No debouncing.

---

### Six concurrent timer intervals

Six `setInterval`/`setTimeout` calls across the app, with each InProcessCard creating its own 1-second interval. No centralized clock service.

---

## Fragile Areas

### AppContext reducer (442 lines)

**Files:** `src/context/AppContext.jsx`

Single file contains all state management, persistence, cross-tab sync, and business logic. 10 action types with complex nested transformations. Zero test coverage.

---

### Notification overlay setTimeout management

**File:** `src/components/Layout/NotificationOverlay.jsx` (lines 19-33)

`lastSeenId` resets on remount (StrictMode double-mount). Timer not stored in ref, making it uncancelable.

---

## Dependencies at Risk

### @dnd-kit/sortable v10.0.0 vs @dnd-kit/core v6.3.1

**File:** `package.json` (lines 13-15)

Major version mismatch between core (6.x) and sortable (10.x). May cause runtime issues after `npm install` in new environments.

---

## Missing Critical Features

- Stage completion modal does not warn that completing advances the lot downstream (`src/components/Queue/InProcessCard.jsx`)
- No supervisor override: lots cannot be sent back, reprioritized, paused, or operator-reassigned after creation
- The "Escalate to Supervisor" button in `src/pages/AIPanel.jsx` (line 189) has no `onClick` handler — it is cosmetic

## Test Coverage Gaps

**What's not tested:** Every file — zero test infrastructure exists. Critical untested logic includes the entire app reducer (all 10 action types), auto-escalation, notification system, charge calculation, waiting lot sorting, and workflow builder.

**Priority:** High

---

*Concerns audit: 2026-06-15*
