---
paths:
  - client/src/**/*.ts
  - client/src/**/*.tsx
---

# TypeScript and React style (`client/src/`)

ESLint, Prettier and `tsc` already enforce type-only imports, `I`-prefixed interfaces, the
hooks rules, stable context values and formatting; run `npm run lint`. This file covers what
they don't. Never edit the generated `client/src/app/client/` or `routeTree.gen.ts`.

## Components

```tsx
import type React from "react";

interface IRepositoryCardProps {
  repository: RepositoryResponse;
}

export const RepositoryCard: React.FC<IRepositoryCardProps> = ({ repository }) => (…);
```

- `export const X: React.FC<IXProps>` (prop-less: `React.FC`), with `import type React`.
- Named exports only, no `export default`. Import modules by their named export.
- No `React.memo`, and no `useMemo` / `useCallback` without a measured reason or a lint
  rule that asks for one (context values).

## Functions and files

- Functions are arrow consts (`const toLabel = (…) => …`). Use a `function` declaration
  only for a generic helper, where an arrow in `.tsx` would need the `<T,>` workaround.
- `.tsx` only when the file contains JSX; hooks and helpers without JSX are `.ts`.
- Component files are PascalCase, helper and hook files camelCase (`useX.ts`), page
  directories kebab-case (`user-list/`, `user-details/`).

## Function parameters

A function with two or more params, any `boolean` param, or optional params after the first
takes one destructured object, so each argument names itself at the call site:
`notifyTaskStarted({ addNotification, taskHref: data.task, title })` (`utils/taskNotify.tsx`).

- Type a one-off object of up to two fields inline (`({ href }: { href: string })`); name it
  `I<Name>Options` / `I<Name>Params` when it's reused or has three or more fields.
- Stay positional for a single obvious arg (`extractTaskId(href)`), comparators
  (`(a, b)`), signatures a library dictates (React handlers, TanStack Query callbacks,
  array callbacks), and the query-module items `queries.md` keeps positional.

## Types

- `interface` for object shapes (small inline param types excepted, see above), `type` for unions, intersections and mapped types.
- No `enum`: use a string-literal union or an `as const` object.
- No `any`. Use `unknown` and narrow, or the real type.
- API types come from the generated client barrel: `import type { UserResponse } from "@app/client"`.
  Don't hand-write a type the client already generates (request bodies, list params,
  responses). Error bodies are the exception: the spec omits them, so they live in
  `queries/utils/openapiErrorTypes.ts`.
- Use `satisfies` to check a constant against a type without widening it
  (`SORTABLE_COLUMN_KEYS … as const satisfies readonly OrderingField<…>[]`).

## Effects and state

- No `useEffect` to derive state from props or other state: compute it during render.
- No `useEffect` + `useState` for server data: use a TanStack Query hook from `queries/`.
- Logic caused by a user action runs in the event handler, not in an effect that watches
  state. Reset a component's state with a `key`, not an effect.

## Imports and the rest

- PatternFly icons are imported from their deep path
  (`@patternfly/react-icons/dist/esm/icons/plus-circle-icon`), not the barrel.
- No `console.log`; `console.error` only where an error has nowhere else to go.
- Comments say what the code can't: a reason, a gotcha, an API quirk. Don't restate the
  code. Exported components and helpers get at most a one- or two-line `/** … */`.

## Checklist

Pass/fail rubric for `/eval`. Check changed `.ts` / `.tsx` files under `client/src/`.

- [ ] Components are `export const X: React.FC<IXProps>` with `import type React`; no
      default exports; no `React.memo`; no speculative `useMemo` / `useCallback`.
- [ ] Functions are arrow consts (generic helpers excepted); JSX-free files are `.ts`.
- [ ] Functions with 2+ params, a `boolean`, or optional params after the first take one
      named object (inline type for ≤2 one-off fields, else `I<Name>Options`), unless they
      match a listed exception.
- [ ] No `enum`, no `any`; object shapes are interfaces.
- [ ] API types are imported from `@app/client`, not redeclared.
- [ ] No effect derives state or fetches data; user-triggered logic lives in handlers.
- [ ] Icons use deep imports; no `console.log`; comments only explain non-obvious reasons.
