<!-- GSD:project-start source:PROJECT.md -->

## Project

**TextileFlow MES**

A manufacturing execution system (MES) for textile factory floors — tracks production lots through stages (Grey → Bleaching → Dyeing → Finishing → Dispatch), manages department queues, and provides supervisor oversight. Currently a fully client-side SPA built with React.

**Core Value:** Operators can reliably track and move lots through production stages, and supervisors have visibility into factory floor status.

### Constraints

- **Tech Stack**: Express backend must integrate with existing React + Vite frontend
- **Architecture**: Backend expands to handle auth, WhatsApp integration, and OCR — existing mock data and localStorage state remain unchanged initially
- **WhatsApp**: Requires WhatsApp Business API setup (Twilio or Meta API) — not yet configured
- **OCR**: Requires an OCR library or service (Tesseract.js or cloud API) for document scanning
- **Deployment**: Vercel deployment will need to accommodate the Express backend (serverless functions or separate hosting)
- **Compatibility**: Auth changes must not break existing lot management functionality
- **No TypeScript**: Both frontend and backend remain JavaScript for now
- **No Tests**: No test infrastructure exists yet — adding tests is optional for this phase

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

| Language | Usage | Version |
|----------|-------|---------|
| JavaScript (JSX) | Application code — all source files | ES2022+ |
| CSS | Custom design system in `src/index.css` | — |
| HTML | Shell file at `index.html` | — |

## Runtime

- **Primary runtime:** Client-side SPA in the browser (no Node.js server)
- **Build tool:** Vite 8.0.12 (`vite.config.js`)
- **Dev server:** Vite dev server (HMR enabled)
- **Package manager:** npm (via `package-lock.json`)

## Framework & Libraries

### Application Framework

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 19.2.6 | UI framework |
| **react-dom** | 19.2.6 | DOM rendering |
| **react-router-dom** | 7.17.0 | Client-side routing |

### UI & Visualization

| Library | Version | Purpose |
|---------|---------|---------|
| **lucide-react** | 1.17.0 | Icon set |
| **recharts** | 3.8.1 | Charts and data visualization |

### Drag & Drop

| Library | Version | Purpose |
|---------|---------|---------|
| **@dnd-kit/core** | 6.3.1 | Drag-and-drop primitives |
| **@dnd-kit/sortable** | 10.0.0 | Sortable list presets |
| **@dnd-kit/utilities** | 3.2.2 | DnD utility functions |

### State Management

- **React Context + useReducer** (`src/context/AppContext.jsx`)
- **localStorage** for persistence (full state serialization on every change)
- **BroadcastChannel API** for cross-tab synchronization

## Styling

- **Custom CSS design system** in `src/index.css` (~1562 lines)
- **Dark theme** with CSS custom properties
- **Google Fonts:** Inter (sans-serif) — loaded via `@import` in CSS
- **No CSS framework** (no Tailwind, Bootstrap, or similar)

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build configuration |
| `eslint.config.js` | ESLint flat config (v10) |
| `vercel.json` | Vercel deployment settings |
| `.vercel/project.json` | Vercel project metadata |
| `.gitignore` | Git ignore rules |

## Dev Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| vite | 8.0.12 | Build tool & dev server |
| @vitejs/plugin-react | 6.0.1 | Vite React plugin (Oxc) |
| eslint | 10.3.0 | Linter |
| eslint-plugin-react-hooks | 7.1.1 | React Hooks lint rules |
| eslint-plugin-react-refresh | 0.5.2 | HMR lint rules |
| globals | 17.6.0 | ESLint global definitions |
| @eslint/js | 10.0.1 | ESLint JS configuration |
| @types/react | 19.2.14 | React type stubs (unused — no TS) |
| @types/react-dom | 19.2.3 | React DOM type stubs (unused) |

## Testing

## CI/CD

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Overview

## Naming Patterns

- Component files use PascalCase: `Sidebar.jsx`, `InProcessCard.jsx`, `OperatorPrompt.jsx`
- Data files use camelCase: `mockData.js`
- CSS file uses kebab-case: `index.css`
- Barrel files (components): `index.jsx` is **not** used — each component is a single `.jsx` file
- Component functions: PascalCase named `export default function ComponentName()`
- Helper/utility functions: camelCase — `formatElapsed()`, `formatTime()`, `formatDuration()`, `timeAgo()`, `hoursAgo()`, `minsAgo()`
- Event handlers: `handle` prefix — `handleSubmit()`, `handleChange()`, `handleSearch()`, `handleComplete()`, `handleStart()`, `handleDismiss()`, `handleViewInQueue()`, `handleDragEnd()`, `handleSwitchUser()`
- Reducer handler functions: Named after the action type but not extracted as standalone functions (defined inline in the switch statement)
- Local variables: camelCase — `stageInfo`, `inProcessLots`, `waitingLots`, `filteredWaiting`, `priorityCounts`
- Constants/static data: UPPER_SNAKE_CASE — `STORAGE_KEY`, `CHANNEL_NAME`, `QUEUE_DEPARTMENTS`, `STAGE_POOL`, `FABRIC_TYPES`, `PARTIES`, `DEPT_CAPACITY`, `WORKFLOW_TEMPLATES`, `PARTY_RATES`, `DEFAULT_RATES`
- Boolean state variables: `is` prefix — `isOpen`, `isDelayed`, `isLastStage`, `isComplete`, `isSelected`, `isDragging`, `isAdmin`, `atCapacity`, `showCustomBuilder`, `showConfirm`, `mobileOpen`, `disabled`
- Refs: `Ref` suffix — `channelRef`, `isExternalUpdate`
- No TypeScript — all types are implicit JavaScript
- No PropTypes validation on any component

## Code Style

- No Prettier configuration detected
- Semicolons: **Required** — every statement ends with `;`
- Arrow functions used for callbacks and inline functions
- Template literals used for string interpolation with backticks
- Single quotes for strings (`'string'`) with backticks for template literals
- ESLint v10 with flat config (`eslint.config.js`)
- Plugins: `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Config: `js.configs.recommended` + `reactHooks.configs.flat.recommended` + `reactRefresh.configs.vite`
- Targets: `**/*.{js,jsx}`
- Global ignore: `dist`

## Import Organization

- Not used — all imports use relative paths (e.g., `../../context/AppContext`, `./ConfirmModal`)
- No `@/` or similar path alias configured

## Component Architecture

- Every component is a single default export function
- No class components anywhere in the codebase
- No higher-order components or render props patterns
- Composition via prop passing: parent pages instantiate child components
- State: `useState` for local UI state
- Side effects: `useEffect` for timers, interval, channel setup, persistence
- Memoization: `useMemo` for derived data/computed values
- Callback memoization: `useCallback` for stable function references passed to children (in `AppContext.jsx`)
- Context: `useContext` via wrapper hook `useApp()`
- Reducer: `useReducer` for global state management (`appReducer`)

## Error Handling

- Form validation: Client-side only, with `validate()` function returning error object, rendered as inline `<span>` with red color
- Context operations: Wrapped in `try-catch` for localStorage and BroadcastChannel operations — console.warn on failure
- Context hook guard: `useApp()` throws `'useApp must be used within an AppProvider'` if called outside provider
- No error boundaries implemented
- No server-side validation (all data is mock/local)
- Null guards: Optional chaining (`?.`) and fallback (`|| 'Unknown'`) patterns used extensively

## Logging

- `console.warn` for recoverable errors (localStorage failures, BroadcastChannel failures)
- `console.log` is **not used** in production code
- No structured logging library

## Comments

- File header banners for every file (ASCII art section separator)
- Inline comments for complex logic sections (e.g., `// Auto-escalation Logic`, `// ── Load initial state ──`, `// Check for escalation`)
- No JSDoc or TSDoc comments anywhere

## Function Design

- Component functions range from 28 lines (`PriorityFilter.jsx`) to 275 lines (`SupervisorDashboard.jsx`)
- Helper functions are small (1-10 lines), typically focused on a single task
- Component props: destructured object — `export default function WaitingCard({ lot, department, disabled })`
- Helper functions: positional parameters — `formatTime(iso)`, `formatDuration(start, end)`
- Components return JSX
- Helpers return primitive values (string, number, boolean, object)
- Filter/map operations return arrays
- Context getter functions return filtered arrays

## Module Design

- Components: single `export default function ComponentName`
- Data utilities: named exports (`export const`, `export function`)
- Context: named exports `AppProvider` and `useApp` + `default export AppContext`

## CSS Conventions

- Single file: `src/index.css` (1562 lines)
- CSS custom properties defined in `:root` for theming
- BEM-like class naming: `.sidebar-logo`, `.sidebar-logo-icon`, `.sidebar-section`, `.sidebar-nav`, `.sidebar-nav-item`
- Utility classes: `.text-secondary`, `.text-tertiary`, `.text-bold`, `.text-semibold`, `.text-mono`
- State classes: `.active`, `.open`, `.selected`, `.done`, `.pending`, `.delayed`, `.warning`, `.on-track`
- Modifier classes: `.priority-urgent`, `.priority-normal`, `.priority-low`, `.status-badge.waiting`, `.status-badge.inprocess`
- Used extensively alongside CSS classes — especially for dynamic values (colors, conditional styles)
- Pattern: `style={{ color: isDelayed ? 'var(--priority-urgent)' : 'var(--status-complete)' }}`
- Google Fonts (`Inter`) imported via `@import url()` in CSS
- No CSS modules, CSS-in-JS, Tailwind, or other styling solution

## Design Patterns

- Global state: `useReducer` in `AppContext.jsx` with a centralized `appReducer`
- Local state: `useState` in individual components
- Cross-tab sync: `BroadcastChannel` API
- Persistence: `localStorage` with JSON serialization
- All timestamps stored as ISO strings (`new Date().toISOString()`)
- Display formatting uses `toLocaleTimeString('en-IN', ...)` and `toLocaleDateString('en-IN', ...)`
- Lots: `'lot_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5)`
- Notifications: `'notif_' + Date.now()`
- Templates: Static IDs like `'template_a'`, `'template_b'`, `'template_c'`
- Workflow templates: Static IDs like `'template_a'`

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- All application state lives in a single `useReducer` in `src/context/AppContext.jsx`
- State is persisted to `localStorage` on every change and loaded on initial mount
- `BroadcastChannel` API synchronizes state across browser tabs in real time
- Role-based access control at the router level (admin vs department operator)
- No external API calls or server-side rendering — fully offline SPA
- Dark theme design system defined entirely in CSS custom properties in `src/index.css`

## Layers

- Purpose: Renders UI, dispatches actions, reads state via context hooks
- Location: `src/pages/`, `src/components/`
- Contains: Route-level page components (6 pages), reusable UI components (8 components)
- Depends on: `AppContext` via `useApp()` hook
- Used by: `App.jsx` routes
- Purpose: Central reducer, persistence, cross-tab sync, query helper functions
- Location: `src/context/AppContext.jsx`
- Contains: `AppProvider` component, `useApp` hook, `appReducer`, 11 action types, 8 query helper functions, auto-escalation logic, undo timer management
- Depends on: `mockData` for `INITIAL_LOTS`, `WORKFLOW_TEMPLATES`, `DEPT_CAPACITY`, `getStageById`, `generateId`
- Used by: All pages and layout components
- Purpose: Static domain definitions and helper utilities
- Location: `src/data/mockData.js`
- Contains: `STAGE_POOL` (14 stages), `WORKFLOW_TEMPLATES` (3 templates), `PARTIES` (6 parties), `FABRIC_TYPES` (12 types), `DEPT_CAPACITY` (14 departments), `DEFAULT_RATES`, `PARTY_RATES`, `INITIAL_LOTS` (6 seed lots), helper functions (`getStageById`, `getRate`, `calculateCharges`, `generateId`, `generateLotNumber`)
- Depends on: Nothing
- Used by: Context layer and page components

## Data Flow

### Primary Request Path — Lot Processing

### State Persistence Flow

### Auto-Escalation Flow

- Single `useReducer` (`appReducer`) handles all state transitions via 11 action types: `CREATE_LOT`, `START_STAGE`, `COMPLETE_STAGE`, `UNDO_COMPLETE`, `CLEAR_UNDO`, `DISMISS_NOTIFICATION`, `DISMISS_ALL_NOTIFICATIONS`, `SET_OPERATOR`, `CLEAR_OPERATOR`, `ADD_WORKFLOW`, `SYNC_STATE`, `CHECK_ESCALATIONS`
- State shape: `{ lots[], workflows[], notifications[], operatorName, department, undoAction }`
- Query helpers computed from state using `useCallback`: `getLotsForDepartment`, `getInProcessLots`, `getWaitingLots`, `getCompletedTodayLots`, `getDepartmentCapacity`, `getActiveNotifications`, `getCompletedLots`, `getDispatchableLots`

## Key Abstractions

- Purpose: Represents a single production lot moving through stages
- Files: Defined in `src/data/mockData.js` (INITIAL_LOTS), created in `src/pages/CreateLot.jsx`, mutated in `src/context/AppContext.jsx`
- Pattern: Plain object with properties — `id`, `lotNumber`, `partyName`, `quantity`, `fabricType`, `colour`, `priority`, `workflowId`, `stages[]`, `currentStageIndex`, `status` (waiting|inprocess|complete), `stageHistory[]`, `createdAt`
- Purpose: A single production step with metadata
- Files: `src/data/mockData.js` (`STAGE_POOL`)
- Pattern: Object with `{ id, name, accent, expectedHours }` — 14 stages from `grey` through `dispatch`
- Purpose: Pre-defined sequence of stages for different fabric types
- Files: `src/data/mockData.js` (`WORKFLOW_TEMPLATES`)
- Pattern: Object with `{ id, name, description, stages[] }`
- Purpose: Cross-department alerts when lots advance between stages
- Files: Created in `src/context/AppContext.jsx`, rendered in `src/components/Layout/NotificationOverlay.jsx`
- Pattern: Object with `{ id, type, lotId, lotNumber, partyName, quantity, targetDepartment, fromDepartment, message, timestamp, dismissed }`

## Entry Points

- Location: `src/main.jsx`
- Triggers: Page load — renders `<App />` inside `<StrictMode>`
- Responsibilities: DOM mount, CSS import
- Location: `src/App.jsx` (inside `AppContent`)
- Triggers: URL navigation via React Router
- Responsibilities: Route matching, role-based rendering (admin vs operator), layout composition (Sidebar + TopBar + content + NotificationOverlay + UndoToast)
- Location: `src/components/Layout/OperatorPrompt.jsx`
- Triggers: No `operatorName` set in state — rendered by `AppContent` before any routes
- Responsibilities: Capture operator identity and department role, dispatch `SET_OPERATOR`
- Location: `src/context/AppContext.jsx` (lines 312-317)
- Triggers: Every 60 seconds via `setInterval`
- Responsibilities: Check all waiting lots against expected duration thresholds
- Location: `src/context/AppContext.jsx` (lines 320-334)
- Triggers: When `undoAction` is set (after `COMPLETE_STAGE`)
- Responsibilities: Clear undo action after its `expiresAt` timestamp
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

### Single Monolithic CSS File

### Heavy Inline Arrow Functions in Rendered JSX

## Error Handling

- `try/catch` on localStorage reads/writes in `AppContext` (lines 18-24, 293-296)
- `try/catch` on BroadcastChannel operations (lines 263, 300)
- Form validation in `CreateLot.jsx` with inline error messages
- Guard clause in `useApp()`: throws if used outside `AppProvider`
- `console.warn` for recoverable errors (localStorage full, BroadcastChannel unavailable)
- No error boundaries at the React level
- No centralized error handler or error logging service

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
