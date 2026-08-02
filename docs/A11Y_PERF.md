# Accessibility & Performance Tracking

Phase 5 exit criteria: major a11y/perf issues are fixed **or tracked**. This file tracks deferred work.

## Accessibility

| Item                             | Status   | Notes                                                           |
| -------------------------------- | -------- | --------------------------------------------------------------- |
| `eslint-plugin-jsx-a11y`         | Done     | Wired in root ESLint config; keep CI lint green                 |
| Route error boundary             | Done     | `RouteErrorFallback` on router `errorComponent`                 |
| Empty / unauthorized states      | Partial  | Tasks and admin detail use gates; broaden as pages land         |
| axe in Playwright                | Deferred | Add `@axe-core/playwright` smokes after main-path e2e is stable |
| Keyboard / focus traps in modals | Deferred | Spot-check PatternFly modals (create/edit) in a follow-up       |

## Performance

| Item                                | Status   | Notes                                                          |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| Route-level code splitting          | Done     | TanStack Router `autoCodeSplitting`                            |
| Manual chunks (React)               | Done     | Vite `manualChunks.react`                                      |
| Prefetch / `ensureQueryData` on nav | Deferred | Prefetch list queries on sidebar hover or `beforeLoad`         |
| Query staleTime tuning              | Deferred | Review hot paths (tasks poll, browse content) after real usage |
| Bundle size budget in CI            | Deferred | Optional size limit once image/build pipeline is routine       |

## How to update

When you fix or accept a row, change **Status** and keep the note short. Prefer linking a PR or issue in the note when work is non-trivial.
