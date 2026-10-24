---
name: code-style
description: TypeScript and React style for client/src that lint can't check — React.FC components, named-object parameters, .ts vs .tsx and file naming, generated API types, satisfies, memoization, effects vs render/handlers/queries, component-folder index.ts imports, and comments.
root: false
targets: ["claudecode", "cursor"]
globs: ["client/src/**/*.ts", "client/src/**/*.tsx"]
---

# TypeScript and React style (`client/src/`)

`npm run lint` checks the mechanical rules (`eslint.config.mjs`); this file covers what it can't.

## Components

```tsx
import type React from "react";

interface IRepositoryCardProps {
  repository: RepositoryResponse;
}

export const RepositoryCard: React.FC<IRepositoryCardProps> = ({ repository }) => (…);
```

- `export const X: React.FC<IXProps>` (prop-less: `React.FC`), with `import type React`.
  Props are always a named `I<Component>Props` interface, never inline (`React.FC<{ … }>`).
- No `useMemo` / `useCallback` without a measured reason or a lint rule that asks for one
  (context values).

## Files

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

## Imports and comments

- Import a component folder (`X/`) only through its `index.ts`, which exports only the
  public component(s); never import another file in `X/` from outside it.
- Comments say what the code can't: a reason, a gotcha, an API quirk. Don't restate the
  code. Exported components and helpers get at most a one- or two-line `/** … */`.

## Checklist

Pass/fail rubric for `/eval`. Check changed `.ts` / `.tsx` files under `client/src/`.

- [ ] Components are `export const X: React.FC<IXProps>` with `import type React` and a
      named `I<Component>Props` interface; no speculative `useMemo` / `useCallback`.
- [ ] JSX-free files are `.ts`; file and directory names follow the casing above.
- [ ] Functions with 2+ params, a `boolean`, or optional params after the first take one
      named object (inline type for ≤2 one-off fields, else `I<Name>Options`), unless they
      match a listed exception.
- [ ] API types are imported from `@app/client`, not redeclared.
- [ ] No effect derives state or fetches data; user-triggered logic lives in handlers.
- [ ] Component folders are imported only through their `index.ts`.
- [ ] Comments only explain non-obvious reasons.
