---
name: signatures
description: Prefer a single named-object parameter over multiple positional args for shared/helper functions, so each argument is self-documenting at the call site; documented exceptions (single obvious arg, comparators, external callback signatures, query-surface rules in queries.md).
globs: client/src/app/**
---

# Function signature conventions (`client/src/app/`)

**Prefer a single named-object parameter over a list of positional arguments.**
Named fields make every argument self-documenting at the call site and let
TypeScript check each one by name — a reader shouldn't have to open the function
to learn what `(addNotification, data.task, "...")` means. This is a **good
practice, not an absolute rule**: the exceptions below are legitimate and
expected, not violations. The query-reading surface is the specific, stricter
instance of this rule — see `evals/queries.md` ("One inline-object arg"); this
spec is the general, app-wide case.

## When to prefer a named-object param

Reach for one object when a signature has any of:

- **two or more parameters**, especially of the same or adjacent type — positional
  args are easy to transpose silently (`fn(name, label)` vs `fn(label, name)`);
- **any `boolean` parameter** — avoid the "boolean trap"; `fn(x, true, false)` is
  unreadable, `fn({ x, isTouched: true, isSubmitted: false })` is not;
- **optional / defaulted params beyond the first** — destructure with defaults
  (`({ title = "Task started" })`) instead of relying on positional order;
- **any param whose meaning isn't obvious from its value** at the call site.

Worked example — `client/src/app/utils/taskNotify.tsx` (the canonical reference):

```tsx
// before — opaque at the call site
notifyTaskStarted(
  addNotification,
  data.task,
  `Remote "${name}" deletion started`,
);

// after — each argument names itself
notifyTaskStarted({
  addNotification,
  taskHref: data.task,
  title: `Remote "${name}" deletion started`,
});
```

## How to type the object (hybrid)

- **Inline anonymous literal** for a small, one-off arg (≤2 fields). Matches the
  query wrappers — `useArtifactDetailQuery({ href }: { href: string })`
  (`queries/artifacts.ts`).

  ```ts
  ({ href, title }: { href: string; title: string }) => { … }
  ```

- **Named `I<Name>Options` / `I<Name>Params` interface** when the shape is reused
  or has 3+ fields. Matches components, which name their props
  `I<Name>Props` — `FormSubmitError.tsx`. Reference:
  `INotifyTaskStartedOptions` in `taskNotify.tsx`.

  ```ts
  export interface INotifyTaskStartedOptions {
    addNotification: INotifyFn;
    taskHref: string;
    title?: string;
  }
  export const notifyTaskStarted = ({
    addNotification,
    taskHref,
    title = "Task started",
  }: INotifyTaskStartedOptions) => { … };
  ```

Field types reused across signatures stay `I`-prefixed named types (e.g.
`IUserListParams`, `IMutationErrorMessage`), never re-spelled inline.

## Legitimate exceptions (stay positional)

Positional args are fine — and often clearer — in these cases:

- **A single required arg of an obvious type** — `extractTaskId(href)`,
  `isHttpError(error, status)`. Wrapping one self-evident value in an object adds
  noise, not clarity.
- **Comparator callbacks** `(a, b)` / `(a, b, locale)` whose positional contract is
  fixed by `Array.prototype.sort` — `localeNumericCompare`, `universalComparator`
  (`utils/utils.ts`).
- **Signatures dictated by an external API you don't control** — React event
  handlers `(event) => …`, React Query callbacks `(data, variables) => …`, and
  array-method callbacks `(item, index) => …`. Match the library's shape.
- **The query-module items already governed by `evals/queries.md`** — key
  factories (`userKeys.listQuery(domain, params)`), `use*Mutation` and their call
  signatures, and private helpers (`build*Href`, `fetchAllPages`). Defer to that
  spec; don't double-rule them here.

## Checklist

Pass/fail rubric for `/eval`.

- [ ] New/changed shared or helper functions with **2+ params** (or any `boolean`,
      or optional params beyond the first) take a **single named-object param**,
      unless they match a documented exception.
- [ ] The object is typed per the **hybrid rule** — an inline literal for a small
      one-off (≤2 fields); a named `I<Name>Options` / `I<Name>Params` interface
      when the shape is reused or has 3+ fields; reused field types stay
      `I`-prefixed.
- [ ] Positional signatures left in place are **only** the documented exceptions
      (single obvious arg; comparators; external/callback contracts; query-surface
      items governed by `evals/queries.md`).
