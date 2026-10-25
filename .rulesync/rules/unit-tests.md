---
name: unit-tests
description: "Apply when writing or changing Vitest unit tests: tests run in Vitest Browser Mode and check what the user sees, using vitest-browser-react, locators, expect.element and mocks at module boundaries."
root: false
targets: ["claudecode", "cursor"]
globs: ["client/src/**/*.test.ts", "client/src/**/*.test.tsx"]
---

# Unit test conventions (Vitest Browser Mode)

Every test runs in [Vitest Browser Mode](https://vitest.dev/guide/browser/) (Playwright,
Chromium), the approach Vitest recommends for component testing. Config: the `test` block in
`client/vite.config.ts`. Run with `npm test`; locally it launches the installed Google Chrome,
CI uses Playwright's Chromium.

## Shape

- Colocated next to the code: `Foo.tsx` → `Foo.test.tsx`, `utils.ts` → `utils.test.ts`.
- Import everything explicitly (no globals): `vitest` for `describe` / `it` / `expect` / `vi`,
  `vitest-browser-react` for `render` / `renderHook`, `vitest/browser` for `page` /
  `userEvent`.
- `describe` per unit, `it` per behaviour, named as a sentence. Test pure logic directly.

## Components and hooks

[Component testing guide](https://vitest.dev/guide/browser/component-testing):

```tsx
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

it("adds the typed tag on Enter", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <TagInput id="tags" value={[]} onChange={onChange} />,
  );

  await screen.getByRole("textbox", { name: "Add tag" }).click();
  await userEvent.keyboard("blue{Enter}");

  expect(onChange).toHaveBeenCalledExactlyOnceWith(["blue"]);
});
```

- `render` / `renderHook` from `vitest-browser-react`, awaited. Hooks needing providers pass
  a `wrapper`; state changes go through the `act` that `renderHook` returns.
- Query with locators: `getByRole(role, { name })` first, then `getByLabelText`,
  `getByText`; `getByTestId` only when nothing else works. PatternFly `Table` cells are
  `gridcell`.
- Interact through the locator (`.click()`, `.fill()`) or `userEvent` from `vitest/browser`,
  never `@testing-library/user-event` or `fireEvent`.
- Assert on the DOM with `await expect.element(locator)`, which retries; plain `expect` is
  for values and mocks. No `waitFor`, no manual `act()` around renders or clicks.

## Mocks

- Module mocks use the `import()` form, then set return values per test with `vi.mocked`:

  ```tsx
  vi.mock(import("@app/hooks/useDefaultDomain"), () => ({
    useDefaultDomain: vi.fn(),
  }));

  it("shows the domain name", async () => {
    vi.mocked(useDefaultDomain).mockReturnValue({
      name: "default",
    } as IPulpDomain);
    const screen = await render(<DomainBadge />);
    await expect.element(screen.getByText("default")).toBeVisible();
  });
  ```

- `vi.spyOn` on a module namespace throws in the browser; use `vi.mock(import(…), { spy: true })`.
- Mock at the module boundary (query hooks, context hooks). Don't mock PatternFly or React.
- A **partial** factory that spreads `await importOriginal()` **hangs** browser-mode RPC
  (`[birpc] rpc is closed`); use a **full factory** that returns only the exports the component
  under test uses (e.g. a modal form needs just its two mutation hooks).
- A form inside a modal needs `useNotifications` mocked — it throws without its provider.
- A modal's accessible name concatenates its field labels, so `getByLabelText("Password")` can
  match the dialog too; prefer `getByRole("textbox", { name, exact: true })` (password inputs
  included).

## What belongs here vs e2e

Pure client behaviour is a component test: form validation messages and submit wiring, confirm
dialog content/style/dismissal, permission-gated disabling + tooltips, a tag/permission input.
Anything needing the real backend (create/edit/delete round-trips, server validation, RBAC,
cross-page sync, navigation) stays in Playwright e2e (`e2e/`).

## Checklist

Pass/fail rubric for `/eval`. Check changed `*.test.ts` / `*.test.tsx` files.

- [ ] Colocated; explicit imports from `vitest`, `vitest-browser-react`, `vitest/browser`.
- [ ] Components and hooks use awaited `render` / `renderHook`; locators prefer role + name.
- [ ] Interactions via locator methods or `vitest/browser` `userEvent`; DOM assertions via
      `await expect.element(…)`; no Testing Library, `waitFor` or manual `act()`.
- [ ] Mocks use `vi.mock(import(…))` + `vi.mocked` at module boundaries.
