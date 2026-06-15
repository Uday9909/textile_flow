# Technology Stack

**Analysis Date:** 2026-06-15
**Focus:** Languages, runtime, frameworks, dependencies, configuration

## Languages

| Language | Usage | Version |
|----------|-------|---------|
| JavaScript (JSX) | Application code — all source files | ES2022+ |
| CSS | Custom design system in `src/index.css` | — |
| HTML | Shell file at `index.html` | — |

> **Note:** No TypeScript. Project uses plain `.jsx` files throughout.

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

> **⚠ Warning:** Major version mismatch between `@dnd-kit/core` (v6) and `@dnd-kit/sortable` (v10). May cause runtime issues in new environments.

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

**No testing infrastructure detected.** No test framework, no test files, no test scripts in `package.json`.

## CI/CD

**No CI pipeline detected.** No GitHub Actions, CircleCI, or similar configuration.

*Stack audit: 2026-06-15*
