<!-- refreshed: 2026-06-15 -->
# Architecture

**Analysis Date:** 2026-06-15

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  BrowserRouter > AppProvider (Context) > AppContent              │
│  `src/main.jsx` → `src/App.jsx`                                  │
├──────────────────┬──────────────────┬────────────────────────────┤
│  Layout          │  Pages           │  Components                │
│  `Sidebar`       │  `DeptQueue`     │  `InProcessCard`           │
│  `TopBar`        │  `CreateLot`     │  `WaitingCard`             │
│  `NotifOverlay`  │  `Dispatch`      │  `CompletedList`           │
│  `OperatorPrompt`│  `AIPanel`       │  `PriorityFilter`          │
│                  │  `Supervisor`    │  `CustomWorkflowBuilder`   │
│                  │  `ProdHistory`   │  `ConfirmModal`            │
│                  │                  │  `UndoToast`               │
└────────┬─────────┴────────┬─────────┴──────────┬─────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     State Management Layer                       │
│  `src/context/AppContext.jsx`                                    │
│  useReducer + localStorage + BroadcastChannel cross-tab sync    │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  `src/data/mockData.js`                                          │
│  Static definitions (stages, workflows, parties, rates)          │
│  Helper functions (charges, ID generation)                       │
│  INITIAL_LOTS seed data                                          │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App | Root component, route definitions, role-based access control (admin vs department operator) | `src/App.jsx` |
| AppContext | Global state management via useReducer, localStorage persistence, BroadcastChannel cross-tab sync, query helpers | `src/context/AppContext.jsx` |
| mockData | All static seed data (stages, workflows, parties, rates, fabric types), helper functions, initial lot seed data | `src/data/mockData.js` |
| Sidebar | Navigation with department queue links, lot count badges, role-based menu (admin vs operator), mobile toggle | `src/components/Layout/Sidebar.jsx` |
| TopBar | Operator name display, live clock, notification bell with badge count | `src/components/Layout/TopBar.jsx` |
| DepartmentQueue | Main screen showing in-process lots, waiting queue with priority filter, completed today list | `src/pages/DepartmentQueue.jsx` |
| CreateLot | Lot creation form with workflow template selection and custom workflow builder | `src/pages/CreateLot.jsx` |
| Dispatch | Lot selection, process completion checklist, auto-generated job charges table, challan/invoice export | `src/pages/Dispatch.jsx` |
| AIPanel | Delay detection analysis, active lot progress tracking, department performance stacked bar chart | `src/pages/AIPanel.jsx` |
| SupervisorDashboard | Factory floor overview, lot search, summary stats, dispatchable lots list | `src/pages/SupervisorDashboard.jsx` |
| ProductionHistory | Lot search, vertical timeline view, CSV export for audit trail | `src/pages/ProductionHistory.jsx` |

## Pattern Overview

**Overall:** Single-page application with centralized state management using React Context + useReducer. No backend — fully client-side with localStorage persistence and BroadcastChannel for cross-tab synchronization.

**Key Characteristics:**
- All application state lives in a single `useReducer` in `src/context/AppContext.jsx`
- State is persisted to `localStorage` on every change and loaded on initial mount
- `BroadcastChannel` API synchronizes state across browser tabs in real time
- Role-based access control at the router level (admin vs department operator)
- No external API calls or server-side rendering — fully offline SPA
- Dark theme design system defined entirely in CSS custom properties in `src/index.css`

## Layers

**Presentation Layer (Pages + Components):**
- Purpose: Renders UI, dispatches actions, reads state via context hooks
- Location: `src/pages/`, `src/components/`
- Contains: Route-level page components (6 pages), reusable UI components (8 components)
- Depends on: `AppContext` via `useApp()` hook
- Used by: `App.jsx` routes

**State Management Layer (Context):**
- Purpose: Central reducer, persistence, cross-tab sync, query helper functions
- Location: `src/context/AppContext.jsx`
- Contains: `AppProvider` component, `useApp` hook, `appReducer`, 11 action types, 8 query helper functions, auto-escalation logic, undo timer management
- Depends on: `mockData` for `INITIAL_LOTS`, `WORKFLOW_TEMPLATES`, `DEPT_CAPACITY`, `getStageById`, `generateId`
- Used by: All pages and layout components

**Data Layer (Mock Data):**
- Purpose: Static domain definitions and helper utilities
- Location: `src/data/mockData.js`
- Contains: `STAGE_POOL` (14 stages), `WORKFLOW_TEMPLATES` (3 templates), `PARTIES` (6 parties), `FABRIC_TYPES` (12 types), `DEPT_CAPACITY` (14 departments), `DEFAULT_RATES`, `PARTY_RATES`, `INITIAL_LOTS` (6 seed lots), helper functions (`getStageById`, `getRate`, `calculateCharges`, `generateId`, `generateLotNumber`)
- Depends on: Nothing
- Used by: Context layer and page components

## Data Flow

### Primary Request Path — Lot Processing

1. Operator logs in via `OperatorPrompt` (`src/components/Layout/OperatorPrompt.jsx`) — dispatches `SET_OPERATOR` with name and department role
2. Admin creates a lot on `CreateLot` page (`src/pages/CreateLot.jsx`) — form validation, workflow selection, dispatches `CREATE_LOT` with full lot object including stages, stageHistory, and metadata
3. Lot appears in the appropriate department queue via `DepartmentQueue` (`src/pages/DepartmentQueue.jsx`) — loads lots using `getWaitingLots(departmentId)` and `getInProcessLots(departmentId)` helpers
4. Operator starts processing via `WaitingCard` (`src/components/Queue/WaitingCard.jsx`) — dispatches `START_STAGE` setting lot status to `inprocess` and recording operator name and start time
5. Operator completes stage via `InProcessCard` (`src/components/Queue/InProcessCard.jsx`) — dispatches `COMPLETE_STAGE` which advances `currentStageIndex`, creates next stage entry in `stageHistory`, generates notification for next department, and sets undo action with 30-second window
6. If last stage completes, lot status becomes `complete` and appears in `Dispatch` (`src/pages/Dispatch.jsx`) for final inspection and challan generation

### State Persistence Flow

1. On app mount: `AppProvider` calls `getInitialState()` which attempts to load from `localStorage.getItem('textileflow_state')`
2. On every state change: `useEffect` persists `state` (excluding `undoAction`) to localStorage and broadcasts via `BroadcastChannel('textileflow-sync')`
3. Other tabs receive `onmessage` events and dispatch `SYNC_STATE` to merge

### Auto-Escalation Flow

1. `useEffect` in `AppProvider` sets `setInterval` every 60 seconds dispatching `CHECK_ESCALATIONS`
2. `checkAutoEscalation` compares actual waiting hours against `expectedHours * 2` for each lot
3. If threshold exceeded and lot is not already `urgent`, sets `priority: 'urgent'` and `autoEscalated: true`
4. UI surfaces auto-escalated lots with an `↑` indicator on the priority badge

**State Management:**
- Single `useReducer` (`appReducer`) handles all state transitions via 11 action types: `CREATE_LOT`, `START_STAGE`, `COMPLETE_STAGE`, `UNDO_COMPLETE`, `CLEAR_UNDO`, `DISMISS_NOTIFICATION`, `DISMISS_ALL_NOTIFICATIONS`, `SET_OPERATOR`, `CLEAR_OPERATOR`, `ADD_WORKFLOW`, `SYNC_STATE`, `CHECK_ESCALATIONS`
- State shape: `{ lots[], workflows[], notifications[], operatorName, department, undoAction }`
- Query helpers computed from state using `useCallback`: `getLotsForDepartment`, `getInProcessLots`, `getWaitingLots`, `getCompletedTodayLots`, `getDepartmentCapacity`, `getActiveNotifications`, `getCompletedLots`, `getDispatchableLots`

## Key Abstractions

**Lot:**
- Purpose: Represents a single production lot moving through stages
- Files: Defined in `src/data/mockData.js` (INITIAL_LOTS), created in `src/pages/CreateLot.jsx`, mutated in `src/context/AppContext.jsx`
- Pattern: Plain object with properties — `id`, `lotNumber`, `partyName`, `quantity`, `fabricType`, `colour`, `priority`, `workflowId`, `stages[]`, `currentStageIndex`, `status` (waiting|inprocess|complete), `stageHistory[]`, `createdAt`

**Stage:**
- Purpose: A single production step with metadata
- Files: `src/data/mockData.js` (`STAGE_POOL`)
- Pattern: Object with `{ id, name, accent, expectedHours }` — 14 stages from `grey` through `dispatch`

**Workflow Template:**
- Purpose: Pre-defined sequence of stages for different fabric types
- Files: `src/data/mockData.js` (`WORKFLOW_TEMPLATES`)
- Pattern: Object with `{ id, name, description, stages[] }`

**Notification:**
- Purpose: Cross-department alerts when lots advance between stages
- Files: Created in `src/context/AppContext.jsx`, rendered in `src/components/Layout/NotificationOverlay.jsx`
- Pattern: Object with `{ id, type, lotId, lotNumber, partyName, quantity, targetDepartment, fromDepartment, message, timestamp, dismissed }`

## Entry Points

**Application Entry:**
- Location: `src/main.jsx`
- Triggers: Page load — renders `<App />` inside `<StrictMode>`
- Responsibilities: DOM mount, CSS import

**Router Entry:**
- Location: `src/App.jsx` (inside `AppContent`)
- Triggers: URL navigation via React Router
- Responsibilities: Route matching, role-based rendering (admin vs operator), layout composition (Sidebar + TopBar + content + NotificationOverlay + UndoToast)

**Operator Entry:**
- Location: `src/components/Layout/OperatorPrompt.jsx`
- Triggers: No `operatorName` set in state — rendered by `AppContent` before any routes
- Responsibilities: Capture operator identity and department role, dispatch `SET_OPERATOR`

**Auto-Escalation Timer:**
- Location: `src/context/AppContext.jsx` (lines 312-317)
- Triggers: Every 60 seconds via `setInterval`
- Responsibilities: Check all waiting lots against expected duration thresholds

**Undo Expiration Timer:**
- Location: `src/context/AppContext.jsx` (lines 320-334)
- Triggers: When `undoAction` is set (after `COMPLETE_STAGE`)
- Responsibilities: Clear undo action after its `expiresAt` timestamp

**Cross-Tab Sync Listener:**
- Location: `src/context/AppContext.jsx` (lines 261-280)
- Triggers: `BroadcastChannel` `onmessage` from other tabs
- Responsibilities: Merge incoming state from other tabs without re-broadcasting

## Architectural Constraints

- **Threading:** Single-threaded browser event loop. No Web Workers used.
- **Global state:** Single global singleton via React Context (`AppContext`). All state mutations go through `useReducer`. No module-level singletons aside from the mock data module (`src/data/mockData.js`).
- **Circular imports:** None detected. Dependency direction: `pages` -> `context` -> `data` and `components` -> `context` -> `data`. No circular chains.
- **No backend dependency:** The application is entirely client-side with no server API calls. All data is seeded and persisted in localStorage. This is a deliberate design for a demo/MVP.
- **No TypeScript:** The entire codebase uses plain JSX with no type annotations or type-checking. `eslint.config.js` uses flat config with `react-hooks` and `react-refresh` plugins but no TypeScript plugin.
- **No routing state:** React Router handles URL-based navigation, but query parameters and URL state are not used for deep-linking or preserving filter state.

## Anti-Patterns

### Inline Styles Mixed With CSS Classes

**What happens:** Many page components in `src/pages/` mix CSS class names with inline `style={{}}` props extensively. For example, `src/pages/CreateLot.jsx` uses inline styles on lines 111, 200-228, 232, 311, etc.
**Why it's wrong:** Inline styles bypass the design system's CSS variables, are harder to override, increase bundle size, and make styling inconsistent across components.
**Do this instead:** Create named CSS classes in `src/index.css` and use className only. See `src/components/Queue/PriorityFilter.jsx` as an example of clean class-based styling.

### Single Monolithic CSS File

**What happens:** All styles (1562 lines) are in a single `src/index.css` file.
**Why it's wrong:** As the application grows, a single CSS file becomes hard to maintain, leads to specificity conflicts, and lacks component scoping.
**Do this instead:** Use CSS modules (`.module.css` co-located with components) or a CSS-in-JS solution consistent with the project's light dependency footprint.

### Heavy Inline Arrow Functions in Rendered JSX

**What happens:** Many event handlers use inline arrow functions like `onClick={() => setSelectedWorkflow(wf.id)}` which create new function references on every render.
**Why it's wrong:** While React 19 may handle this better, it's still an anti-pattern that prevents memoization and can cause unnecessary re-renders of child components.
**Do this instead:** Extract handlers to named functions or use `useCallback` where performance is a concern.

## Error Handling

**Strategy:** Minimal. Error handling is limited to:
- `try/catch` on localStorage reads/writes in `AppContext` (lines 18-24, 293-296)
- `try/catch` on BroadcastChannel operations (lines 263, 300)
- Form validation in `CreateLot.jsx` with inline error messages
- Guard clause in `useApp()`: throws if used outside `AppProvider`

**Patterns:**
- `console.warn` for recoverable errors (localStorage full, BroadcastChannel unavailable)
- No error boundaries at the React level
- No centralized error handler or error logging service

## Cross-Cutting Concerns

**Logging:** `console.warn` only for localStorage/BroadcastChannel failures. No structured logging.

**Validation:** Form-level validation in `CreateLot.jsx` (required fields, positive quantity). No validation for state mutations in the reducer. Stage completion logic includes sanity checks (`if (!lot) return state`).

**Authentication:** None. Identity is captured via `OperatorPrompt` (name + role) and stored in localStorage. No passwords, tokens, or session management. Role-based access is enforced at the route level in `AppContent`.

---

*Architecture analysis: 2026-06-15*
