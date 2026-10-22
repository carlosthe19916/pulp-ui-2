# Accessibility & Performance Tracking

Deferred a11y and perf work. When you fix or accept a row, update **Status** and keep
the note short. Link a PR for non-trivial work.

## Accessibility

| Item                        | Status   | Notes                                                                                |
| --------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `eslint-plugin-jsx-a11y`    | Done     | Wired in `eslint.config.mjs`                                                         |
| Route error boundary        | Done     | `RouteErrorFallback` as root `errorComponent`                                        |
| Empty / unauthorized states | Done     | Shared DataView body states and `DetailRouteError` render `UnauthorizedState` on 403 |
| axe in Playwright           | Deferred | Add `@axe-core/playwright` smokes                                                    |
| Keyboard / focus in modals  | Deferred | Spot-check PluginForm wizards and confirm modals                                     |

## Performance

| Item                       | Status   | Notes                                          |
| -------------------------- | -------- | ---------------------------------------------- |
| Route-level code splitting | Done     | TanStack Router `autoCodeSplitting`            |
| Manual chunks              | Done     | Vite `manualChunks` in `client/vite.config.ts` |
| Detail-route prefetch      | Done     | Route `loader`s prime the detail query         |
| List prefetch on nav       | Deferred | Prefetch list queries on sidebar hover         |
| Query `staleTime` tuning   | Deferred | Hot paths: task polling, content lists         |
| Bundle size budget in CI   | Deferred |                                                |
