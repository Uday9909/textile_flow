# Codebase Structure

**Analysis Date:** 2026-06-15

## Directory Layout

```
keshav/                          # Project root — TextileFlow MES
├── index.html                   # SPA entry HTML (Vite template)
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite build config (React plugin)
├── eslint.config.js             # ESLint flat config (JSX + react-hooks)
├── vercel.json                  # Vercel deployment config (SPA rewrites)
├── .gitignore                   # Git ignore rules
├── README.md                    # Default Vite README (unmodified)
│
├── public/                      # Static assets served as-is
│   └── favicon.svg              # Favicon
│
├── src/                         # Application source code
│   ├── main.jsx                 # React DOM mount point
│   ├── App.jsx                  # Root component, router, layout, role-gating
│   ├── index.css                # Single CSS file — entire design system (1562 lines)
│   │
│   ├── context/                 # State management
│   │   └── AppContext.jsx       # Single global Context + useReducer + localStorage + BroadcastChannel
│   │
│   ├── data/                    # Mock data layer
│   │   └── mockData.js          # All static data + helper functions
│   │
│   ├── pages/                   # Route-level page components (6 files)
│   │   ├── DepartmentQueue.jsx  # Main department queue dashboard (hero screen)
│   │   ├── CreateLot.jsx        # Lot creation form with workflow selection
│   │   ├── Dispatch.jsx         # Final dispatch station with charges table
│   │   ├── AIPanel.jsx          # AI delay detection and performance analysis
│   │   ├── SupervisorDashboard.jsx  # Management overview with factory floor
│   │   └── ProductionHistory.jsx    # Lot traceability with timeline and CSV export
│   │
│   ├── components/              # Reusable UI components
│   │   ├── Layout/              # App chrome / layout components
│   │   │   ├── Sidebar.jsx          # Navigation sidebar (admin + operator mode)
│   │   │   ├── TopBar.jsx           # Top bar with clock and notification bell
│   │   │   ├── NotificationOverlay.jsx  # Slide-down notification banner
│   │   │   └── OperatorPrompt.jsx   # First-launch identity/role capture
│   │   │
│   │   ├── Queue/               # Department queue sub-components
│   │   │   ├── InProcessCard.jsx    # Live timer + complete button + delay detection
│   │   │   ├── WaitingCard.jsx      # Priority-sorted waiting lot with START button
│   │   │   ├── CompletedList.jsx    # Collapsible completed-today list
│   │   │   └── PriorityFilter.jsx   # Tab bar filter for urgent/normal/low/all
│   │   │
│   │   ├── CreateLot/           # Lot creation sub-components
│   │   │   └── CustomWorkflowBuilder.jsx  # Drag-and-drop workflow editor (dnd-kit)
│   │   │
│   │   └── common/              # Generic reusable components
│   │       ├── ConfirmModal.jsx     # Generic confirmation dialog
│   │       └── UndoToast.jsx        # 30-second undo countdown toast
│   │
│   └── assets/                  # Image assets
│       ├── hero.png
│       └── vite.svg
│
├── dist/                        # Vite build output (gitignored)
│
├── node_modules/                # Dependencies (gitignored)
│
├── .vercel/                     # Vercel build metadata (gitignored — in .gitignore)
│
└── .planning/                   # Planning documents
    └── codebase/                # Codebase analysis documents
        ├── ARCHITECTURE.md
        └── STRUCTURE.md
```

## Directory Purposes

**`/` (root):**
- Purpose: Project configuration and entry point
- Contains: Build config (`vite.config.js`), lint config (`eslint.config.js`), deployment config (`vercel.json`), package manifest (`package.json`)
- Key files: `index.html` (loads `/src/main.jsx` as module entry)

**`src/`:**
- Purpose: All application source code
- Contains: 4 subdirectories + 3 top-level files
- No TypeScript — all `.jsx` and `.js` files

**`src/context/`:**
- Purpose: Single file containing the entire state management layer
- Contains: `AppContext.jsx` — the only context provider in the app
- Key files: `AppContext.jsx` (443 lines — the largest source file)

**`src/data/`:**
- Purpose: Single file containing all mock/seed data and domain helpers
- Contains: `mockData.js` — static stage pool, workflow templates, parties, fabric types, rates, 6 seed lots, and utility functions

**`src/pages/`:**
- Purpose: Route-level components corresponding to each URL path
- Contains: 6 page components, each a named default export
- Routing: Defined in `App.jsx` via React Router `<Routes>` and `<Route>`

**`src/components/Layout/`:**
- Purpose: Components that form the persistent app chrome (sidebar, top bar, notifications)
- Contains: 4 layout components rendered inside every admin page and conditionally for operators

**`src/components/Queue/`:**
- Purpose: Sub-components used exclusively by `DepartmentQueue` page
- Contains: 4 components for rendering in-process, waiting, completed lots and priority filtering

**`src/components/CreateLot/`:**
- Purpose: Sub-components used exclusively by `CreateLot` page
- Contains: 1 component — the drag-and-drop workflow builder modal

**`src/components/common/`:**
- Purpose: Truly reusable UI primitives
- Contains: 2 components — `ConfirmModal` (generic dialog) and `UndoToast` (action undo notification)

**`src/assets/`:**
- Purpose: Static image files
- Contains: `hero.png` and `vite.svg`

## Key File Locations

**Entry Points:**
- `src/main.jsx`: React DOM render entry — mounts `<App />` into `#root`
- `index.html`: HTML entry — loads `/src/main.jsx` as module script

**Configuration:**
- `package.json`: Dependencies, scripts (dev/build/lint/preview)
- `vite.config.js`: Vite configuration with React plugin
- `eslint.config.js`: ESLint flat config with `eslint:recommended`, `react-hooks/recommended`, `react-refresh/vite`
- `vercel.json`: Vercel deployment — Vite framework, SPA rewrite rule `/(.*)` -> `/index.html`
- `.gitignore`: Standard Vite ignores + `.vercel`

**Core Logic:**
- `src/context/AppContext.jsx` (443 lines): Reducer, persistence, sync, query helpers — the brain of the application
- `src/data/mockData.js` (287 lines): All domain data and utilities
- `src/App.jsx` (83 lines): Routing, role-gating, layout composition

**Testing:**
- No test files exist. No test framework is configured. No test directories.

## Naming Conventions

**Files:**
- PascalCase for React components: `DepartmentQueue.jsx`, `NotificationOverlay.jsx`, `CustomWorkflowBuilder.jsx`
- camelCase for non-component modules: `mockData.js`, `index.css`
- React components use `.jsx` extension exclusively

**Directories:**
- PascalCase for component groups: `Layout/`, `Queue/`, `CreateLot/`
- camelCase for non-component directories: `context/`, `data/`, `assets/`, `pages/`
- Modules within a directory: `Context.jsx` file names inside `context/`, `PageName.jsx` inside `pages/`

## Where to Add New Code

**New Feature (route-level page):**
- Primary code: `src/pages/NewFeature.jsx`
- Register route: `src/App.jsx` (add `<Route>` in the admin block)
- Add link: `src/components/Layout/Sidebar.jsx` (add nav item)

**New Component (reusable within a page):**
- Implementation: `src/components/<FeatureGroup>/ComponentName.jsx`
- If shared across pages: `src/components/common/ComponentName.jsx`

**New State / Action:**
- Add action type: `src/context/AppContext.jsx` (add `case 'NEW_ACTION'` in reducer)
- Add dispatch call: from the relevant page or component
- Add query helper (if computed): add `useCallback` in the `AppProvider` and expose in the context value

**New Domain Data:**
- Static definitions: `src/data/mockData.js` (add to STAGE_POOL, PARTIES, etc.)
- New utility function: `src/data/mockData.js`

**New Styles:**
- Add CSS classes to `src/index.css` using the existing design system custom properties
- Do not add additional CSS files — the entire style system is in one file

**New Tests:**
- No test infrastructure exists. To add: create a test config file (`vitest.config.js`), install Vitest, add tests in `__tests__/` directories or co-located `.test.jsx` files.

**Utilities / Helpers:**
- Shared helpers that are not domain-specific: create `src/lib/` or `src/utils/` directory (does not exist yet)

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents consumed by GSD planning
- Generated: Yes (by `/gsd-map-codebase` command)
- Committed: Yes

**`dist/`:**
- Purpose: Build output
- Generated: Yes (by `vite build`)
- Committed: No (in .gitignore)

**`public/`:**
- Purpose: Static files copied verbatim to build output
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-06-15*
