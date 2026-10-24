---
name: placement
description: File placement by scope (shared → app root, single page → page sub-dir, no area-level dirs), context file layout, typed PatternFly class names, import block order.
root: false
targets: ["claudecode", "cursor"]
globs: ["client/src/app/**", "client/src/catalog/**"]
---

# Placement and module conventions (`client/src/app/`)

## Placement by scope

- Used by more than one page → app root (`@app/components`, `@app/hooks`, `@app/utils`,
  `@app/context`), even if all users are in one area.
- Used by exactly one page → that page's own sub-directory (`./components/X`,
  `./hooks/useX`), imported relatively.
- Area directories (`pages/<area>/`, `pages/<area>/<entity>/`) only group pages: no
  `components/`, `hooks/` or `utils/` there.
- A page's main component and its `*DetailRoute.tsx` adapter stay at the page root.
- When a page-local module gains a second page user, move it to the app root.

```
client/src/app/
  components/  hooks/  context/  utils/   # shared, app-root layers
  pages/
    content-management/                   # area — NO sub-dirs of its own
      repositories/                       # entity — groups its pages
        repository-list/                  # page
          RepositoryList.tsx              # main component (page root)
          components/                     # used only by this page
            RepositoryModal.tsx
          hooks/
            useRepositoryForm.ts
        repository-detail/                # page
          RepositoryDetail.tsx
          RepositoryDetailRoute.tsx       # route → component adapter (page root)
          components/
      content/
        content-list/  content-detail/  …
```

`PluginContentPanel` is used by the content page and the repository version page, so it
lives in `@app/components/`, not under `pages/content-management/`.

## Context

- One folder per context: `context/<Name>/<Name>Context.tsx` (the `createContext` call +
  value type) and `<Name>Provider.tsx` (the provider). Never both in one file.

## PatternFly class names

- No hardcoded `pf-v6-c-*`, `pf-m-*`, `pf-u-*`, `pf-l-*` strings in source (tests may assert
  on them). Import the typed constants from `@patternfly/react-styles/css/...`; combine with
  `css()`.

## Imports

Blocks separated by a blank line, alphabetical within each: React/`react-*` → other package
deps → `@patternfly/*` → `@app/*` (and `@catalog`) → relative.

## Checklist

Pass/fail rubric for `/eval`.

- [ ] New or moved modules sit at the right scope: shared by >1 page → app root; used by one
      page → that page's sub-directory.
- [ ] No `components/`, `hooks/` or `utils/` directory under an area or entity directory.
- [ ] New contexts follow `context/<Name>/<Name>Context.tsx` + `<Name>Provider.tsx`.
- [ ] No hardcoded PatternFly class strings outside tests; typed `@patternfly/react-styles`
      constants instead.
- [ ] Imports follow the five-block order.
