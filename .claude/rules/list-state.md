---
paths:
  - client/src/app/pages/**
  - client/src/app/components/**
  - client/src/app/hooks/**
  - client/src/routes/**
---

# List state (filters, sort, page)

[ADR 0013](../../docs/adr/0013-view-state-persistence.md) decides where a list's state is kept; tabs use the same mechanism ([tab-state](tab-state.md)).
In code that is **only state management**: `usePersistentState` (`@app/hooks/usePersistentState`)
replaces `useState`; PatternFly props, debouncing and API params stay in the page.

## Define once, choose where at the call

```ts
// remote-list/remoteListState.ts: what the list keeps, one definition per piece
export const REMOTE_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isRemotePulpType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});

// RemoteList.tsx: where each piece is kept
const [pagination, setPagination] = usePersistentState({
  ...REMOTE_LIST_STATE.pagination,
  storage: "url", // "url" | "session" | "local" | "state"
});
```

- Pagination, sort and filters are one `usePersistentState` call each. It returns
  `[value, setValue]` with a stable setter; changing `storage` changes no other line.
- `storage` follows ADR 0013's default: `"url"` for a page's or tab's main list; `"state"` for a
  list that isn't a screen's main list or can be shown several times at once (modals, expanded
  rows, drawers, dashboard cards); `"session"` / `"local"` only where the screen should remember.
- A list's definitions are one `defineListState({ … })` object, `<LIST>_STATE`, in
  `<list>State.ts` next to the page; never a type annotation, which would widen each piece. Its
  pieces: `definePersistentState`, or `PAGINATION_STATE`, `defineSortState` and `schemaFromGuard` from
  `@app/utils/listState`. A schema or default built in the component makes the setter unstable.
  A pagination-only list spreads `PAGINATION_STATE` directly, with no state file.
- A `"state"` piece whose default comes from props (`ContentPicker`'s first content type) stays a
  `useState`: nothing persists, and a default built per render would unsettle the setter.
- DataView's own state hooks (`useDataViewPagination`, `useDataViewFilters`, `useDataViewSort`)
  are lint-blocked: they keep a second copy of the state.
- Browse sections define their state with `defineBrowseListState` at module scope and read it
  with `useBrowseListState`; `PluginBrowse` scopes each section by its key.
- The hook already writes with `replace` (no Back step), leaves defaults out of the address, and
  scopes session/local keys by route and domain. Don't redo any of it: no own `navigate` for list
  state, no domain in `key`.

## Schemas (zod)

These schemas are zod; yup is for forms only ([forms](forms.md)).

- A flat `z.object`, one schema per field; field names become the query params, so use short
  readable words (`name`, `pulp_type`). Values arrive as strings: `z.coerce.number()`,
  `z.stringbool()`. A list field has a list default (`[]`). No `.default()` / `.catch()`: a missing
  or invalid field already falls back to `defaultValue`.
- A filter over an API enum is a picker (`MultiSelectFilter`), never free text. A fixed set of
  values is `z.enum(VALUES)` (`as const satisfies readonly ParamType[]`); values the catalog knows
  use `z.array(schemaFromGuard(guard))`, where the guard narrows to the generated param type
  (`isContentPulpType` in `@app/utils/contentPulpType`). Either way the params take it without a
  cast.

## The page

- A filter, sort or page-size change also sets page 1, in the same handler.
- The toolbar reads the state itself (`values={filters}`), so restored filters show as chips;
  clearing sets the definition's `defaultValue` (`setFilters(REMOTE_LIST_STATE.filters.defaultValue)`).
- `columnSort` (`@app/utils/sortHelpers`) gives `ordering` and `<Th>` sort props;
  `ListPagination` takes `pagination` and `onPaginationChange={setPagination}`.

## The list's route

A page's main list in the URL declares its state on its route, so links into it are
type-checked and leave defaults out:

```ts
// routes/…/remotes/index.ts
const { validateSearch, search } = listSearch(REMOTE_LIST_STATE);
createFileRoute("…/remotes/")({ validateSearch, search, component: RemoteList });

// any page: checked against the list's schemas
<Link to="/content-management/$pulpDomain/remotes" params={…} search={{ pulp_type: ["file.file"] }} />
```

- The page and the route import the same `<LIST>_STATE`, so they can't drift.
- The route only declares: the list still reads its state through `usePersistentState`, and
  other lists' params pass through. A prefixed list (inside a `PersistentStateScopeProvider`) isn't
  declared, since its prefix depends on the screen.
- No per-list type test: `utils/listState.typecheck.ts` guards `listSearch` for every list.

## Reused lists and the URL

- A reused list never picks its own prefix: the screen showing it wraps it in
  `<PersistentStateScopeProvider prefix="…">` (`@app/context/PersistentStateScope/PersistentStateScopeProvider`),
  turning `page` into `prefix.page`. The dev error "Two persistent states on one screen use …"
  means a scope is missing.
- No `window.location` reads or hand-built query strings; a link to a filtered list passes
  `search` with the list's field names.
- Changing a route's own search param in place uses `search: (prev) => ({ ...prev, … })`; the
  object form replaces the whole query and wipes the list's state.
- Query values are plain strings (`parseSearch` / `stringifySearch`, `@app/utils/searchParams`):
  `validateSearch` gets `string | string[]`, never numbers or JSON.

## Checklist

Pass/fail rubric for `/eval`. Check changed list pages, list components, hooks and routes.

- [ ] Each changed list keeps pagination, sort and filters in `usePersistentState`, one call per
      piece (a props-derived `"state"` piece may stay `useState`).
- [ ] `storage` is `"url"` for a page's or tab's main list, `"state"` in modals, expanded rows,
      drawers and cards, session or local only where the screen should remember.
- [ ] Schemas are flat zod objects that convert strings, with list defaults for list fields and
      no `.default()` / `.catch()`; enum filters are pickers typed with `schemaFromGuard`, with no
      cast in the params.
- [ ] Filter, sort and page-size changes also set page 1.
- [ ] The toolbar's values are the state; clearing sets the definition's `defaultValue`.
- [ ] No own history writes, default values or domain in keys for list state: the hook does them.
- [ ] A reused list is namespaced by its screen with `PersistentStateScopeProvider`.
- [ ] A list's definitions are one `defineListState` `<LIST>_STATE` in `<list>State.ts` (no schema or default
      built in the component); a page's main URL list passes `listSearch(<LIST>_STATE)` to its
      route.
- [ ] No `window.location` reads or hand-built query strings; in-place search changes use the
      `prev =>` form; `validateSearch` expects strings.
