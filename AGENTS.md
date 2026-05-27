# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **frontend-only** React 19 + TypeScript + Vite 8 PWA for the Toquida carwash customer app. There is no backend in this repo — it uses a built-in mock API for development (`VITE_USE_MOCK_API=true` in `.env.development`).

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves on `http://localhost:5173`) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Build (mock/staging) | `npm run build:pages-mock` |
| Preview production build | `npm run preview` |

### Important notes

- **Mock API**: Create `.env.development` with `VITE_USE_MOCK_API=true` to use the built-in mock API. This file is gitignored. Without it, the app attempts to reach the production backend at `https://toquida-backend.onrender.com`.
- **No test framework**: There are no automated tests in this repo. Validation is done via lint (`npm run lint`) and TypeScript compilation (`tsc -b`).
- **Pre-existing lint errors**: The codebase has 4 pre-existing ESLint errors (react-hooks/set-state-in-effect, react-refresh/only-export-components) in `MarqueeRotator.tsx`, `VehicleDesignPicker.tsx`, `ProfilePage.tsx`, and `VehicleCompanionPage.tsx`. These are not introduced by new changes.
- **Node version**: Requires Node.js v22+. The environment already has this available.
- **Package manager**: Uses npm (lockfile is `package-lock.json`).
