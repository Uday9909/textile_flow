# Coding Conventions

**Analysis Date:** 2026-06-15

## Overview

This project is a React 19 + Vite 8 single-page application (TextileFlow MES) written entirely in JavaScript with JSX. There is no TypeScript usage. The codebase follows a functional component pattern with React Hooks.

## Naming Patterns

**Files:**
- Component files use PascalCase: `Sidebar.jsx`, `InProcessCard.jsx`, `OperatorPrompt.jsx`
- Data files use camelCase: `mockData.js`
- CSS file uses kebab-case: `index.css`
- Barrel files (components): `index.jsx` is **not** used — each component is a single `.jsx` file

**Functions:**
- Component functions: PascalCase named `export default function ComponentName()`
- Helper/utility functions: camelCase — `formatElapsed()`, `formatTime()`, `formatDuration()`, `timeAgo()`, `hoursAgo()`, `minsAgo()`
- Event handlers: `handle` prefix — `handleSubmit()`, `handleChange()`, `handleSearch()`, `handleComplete()`, `handleStart()`, `handleDismiss()`, `handleViewInQueue()`, `handleDragEnd()`, `handleSwitchUser()`
- Reducer handler functions: Named after the action type but not extracted as standalone functions (defined inline in the switch statement)

**Variables:**
- Local variables: camelCase — `stageInfo`, `inProcessLots`, `waitingLots`, `filteredWaiting`, `priorityCounts`
- Constants/static data: UPPER_SNAKE_CASE — `STORAGE_KEY`, `CHANNEL_NAME`, `QUEUE_DEPARTMENTS`, `STAGE_POOL`, `FABRIC_TYPES`, `PARTIES`, `DEPT_CAPACITY`, `WORKFLOW_TEMPLATES`, `PARTY_RATES`, `DEFAULT_RATES`
- Boolean state variables: `is` prefix — `isOpen`, `isDelayed`, `isLastStage`, `isComplete`, `isSelected`, `isDragging`, `isAdmin`, `atCapacity`, `showCustomBuilder`, `showConfirm`, `mobileOpen`, `disabled`
- Refs: `Ref` suffix — `channelRef`, `isExternalUpdate`

**Types:**
- No TypeScript — all types are implicit JavaScript
- No PropTypes validation on any component

## Code Style

**Formatting:**
- No Prettier configuration detected
- Semicolons: **Required** — every statement ends with `;`
- Arrow functions used for callbacks and inline functions
- Template literals used for string interpolation with backticks
- Single quotes for strings (`'string'`) with backticks for template literals

**Indentation:** 2 spaces

**Linting:**
- ESLint v10 with flat config (`eslint.config.js`)
- Plugins: `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Config: `js.configs.recommended` + `reactHooks.configs.flat.recommended` + `reactRefresh.configs.vite`
- Targets: `**/*.{js,jsx}`
- Global ignore: `dist`

## Import Organization

**Order observed:**
1. React / framework imports (react, react-router-dom, recharts)
2. Internal context/hooks (`../../context/AppContext`)
3. Internal data (`../../data/mockData`)
4. Internal components (`../../components/...`)
5. Icon library (lucide-react)

**Path Aliases:**
- Not used — all imports use relative paths (e.g., `../../context/AppContext`, `./ConfirmModal`)
- No `@/` or similar path alias configured

**Import grouping style:**
```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getStageById } from '../../data/mockData';
import { Clock, CheckCircle2, Package } from 'lucide-react';
```

## Component Architecture

**Structure:**
- Every component is a single default export function
- No class components anywhere in the codebase
- No higher-order components or render props patterns
- Composition via prop passing: parent pages instantiate child components

**Hook usage:**
- State: `useState` for local UI state
- Side effects: `useEffect` for timers, interval, channel setup, persistence
- Memoization: `useMemo` for derived data/computed values
- Callback memoization: `useCallback` for stable function references passed to children (in `AppContext.jsx`)
- Context: `useContext` via wrapper hook `useApp()`
- Reducer: `useReducer` for global state management (`appReducer`)

**File comment headers:**
Every file starts with a banner comment:
```javascript
// ============================================================
// Component Name — Brief description
// ============================================================
```

## Error Handling

**Patterns:**
- Form validation: Client-side only, with `validate()` function returning error object, rendered as inline `<span>` with red color
- Context operations: Wrapped in `try-catch` for localStorage and BroadcastChannel operations — console.warn on failure
- Context hook guard: `useApp()` throws `'useApp must be used within an AppProvider'` if called outside provider
- No error boundaries implemented
- No server-side validation (all data is mock/local)
- Null guards: Optional chaining (`?.`) and fallback (`|| 'Unknown'`) patterns used extensively

**Example — form validation:**
```javascript
const validate = () => {
  const newErrors = {};
  if (!formData.partyName.trim()) newErrors.partyName = 'Party name is required';
  if (!formData.lotNumber.trim()) newErrors.lotNumber = 'Lot number is required';
  // ...
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Example — context error handling:**
```javascript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
} catch (e) {
  console.warn('Failed to save state:', e);
}
```

## Logging

**Framework:** `console`

**Patterns:**
- `console.warn` for recoverable errors (localStorage failures, BroadcastChannel failures)
- `console.log` is **not used** in production code
- No structured logging library

## Comments

**When to Comment:**
- File header banners for every file (ASCII art section separator)
- Inline comments for complex logic sections (e.g., `// Auto-escalation Logic`, `// ── Load initial state ──`, `// Check for escalation`)
- No JSDoc or TSDoc comments anywhere

**Comment style:**
```javascript
// ── Section divider ──
// Inline logic explanation
```

## Function Design

**Size:**
- Component functions range from 28 lines (`PriorityFilter.jsx`) to 275 lines (`SupervisorDashboard.jsx`)
- Helper functions are small (1-10 lines), typically focused on a single task

**Parameters:**
- Component props: destructured object — `export default function WaitingCard({ lot, department, disabled })`
- Helper functions: positional parameters — `formatTime(iso)`, `formatDuration(start, end)`

**Return Values:**
- Components return JSX
- Helpers return primitive values (string, number, boolean, object)
- Filter/map operations return arrays
- Context getter functions return filtered arrays

## Module Design

**Exports:**
- Components: single `export default function ComponentName`
- Data utilities: named exports (`export const`, `export function`)
- Context: named exports `AppProvider` and `useApp` + `default export AppContext`

**Barrel Files:** Not used. Each file is imported directly by its path.

## CSS Conventions

**Organization:**
- Single file: `src/index.css` (1562 lines)
- CSS custom properties defined in `:root` for theming
- BEM-like class naming: `.sidebar-logo`, `.sidebar-logo-icon`, `.sidebar-section`, `.sidebar-nav`, `.sidebar-nav-item`
- Utility classes: `.text-secondary`, `.text-tertiary`, `.text-bold`, `.text-semibold`, `.text-mono`
- State classes: `.active`, `.open`, `.selected`, `.done`, `.pending`, `.delayed`, `.warning`, `.on-track`
- Modifier classes: `.priority-urgent`, `.priority-normal`, `.priority-low`, `.status-badge.waiting`, `.status-badge.inprocess`

**Inline styles:**
- Used extensively alongside CSS classes — especially for dynamic values (colors, conditional styles)
- Pattern: `style={{ color: isDelayed ? 'var(--priority-urgent)' : 'var(--status-complete)' }}`

**Imports:**
- Google Fonts (`Inter`) imported via `@import url()` in CSS
- No CSS modules, CSS-in-JS, Tailwind, or other styling solution

## Design Patterns

**State Management:**
- Global state: `useReducer` in `AppContext.jsx` with a centralized `appReducer`
- Local state: `useState` in individual components
- Cross-tab sync: `BroadcastChannel` API
- Persistence: `localStorage` with JSON serialization

**Date/Time:**
- All timestamps stored as ISO strings (`new Date().toISOString()`)
- Display formatting uses `toLocaleTimeString('en-IN', ...)` and `toLocaleDateString('en-IN', ...)`

**ID Generation:**
- Lots: `'lot_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5)`
- Notifications: `'notif_' + Date.now()`
- Templates: Static IDs like `'template_a'`, `'template_b'`, `'template_c'`
- Workflow templates: Static IDs like `'template_a'`

---

*Convention analysis: 2026-06-15*
