---
name: add-list-state
description: Use when adding a paged list or changing where its filters, sort or pagination are kept (URL, tab, browser, component) with usePersistentState (ADR 0013), or when a lint error says DataView's state hooks are restricted. Step-by-step recipe with the Remotes list as the worked example.
targets: ["*"]
---

# Add a list's state with `usePersistentState`

The rules are in `.rulesync/rules/list-state.md` (read it first); this is the recipe. The worked
example is the Remotes list: `remote-list/remoteListState.ts`, `RemoteList.tsx` and its route
`routes/_authenticated/content-management/$pulpDomain/remotes/index.ts`. Copy their shape.

## 1. Decide where each piece is kept

| The list is…                                               | `storage`                                       |
| ---------------------------------------------------------- | ----------------------------------------------- |
| a page's main list, or a tab's                             | `"url"`                                         |
| in a modal, an expanded row, a drawer or a dashboard card  | `"state"`                                       |
| a reused component (`TasksTable`, `RoleAssignmentsTab`, …) | the screen decides; wrap it in a scope (step 4) |

## 2. Write `<list>State.ts` next to the page

```ts
export const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IWidgetListParams>[];

export const WIDGET_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isWidgetType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});
```

- A pagination-only list skips the file and spreads `PAGINATION_STATE`.
- An enum filter is a `MultiSelectFilter` picker: `z.enum(VALUES)` for a fixed set, or
  `schemaFromGuard` with a catalog guard (`isRemotePulpType`, `isContentPulpType`).
- Numbers and booleans from the URL: `z.coerce.number()`, `z.stringbool()`.
- A Browse section uses `defineBrowseListState` + `useBrowseListState` instead (see `RpmBrowse.tsx`).

## 3. Wire the page

```ts
const [pagination, setPagination] = usePersistentState({
  ...WIDGET_LIST_STATE.pagination,
  storage: "url",
});
const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));
const [sort, setSort] = usePersistentState({
  ...WIDGET_LIST_STATE.sort,
  storage: "url",
});
const { ordering, sortProps } = columnSort({
  columnKeys: SORTABLE_COLUMN_KEYS,
  sort,
  onSort: (next) => {
    setSort(next);
    toFirstPage();
  },
});
const [filters, setFilters] = usePersistentState({
  ...WIDGET_LIST_STATE.filters,
  storage: "url",
});
// query…, then:
usePageInRange({ pagination, setPagination, count: data?.count });
```

- Toolbar: `values={filters}`, `onChange` merges and goes to page 1; clearing sets
  `WIDGET_LIST_STATE.filters.defaultValue` and goes to page 1.
- `<ListPagination pagination={pagination} onPaginationChange={setPagination} />`.

## 4. Scope reused lists and tabs

Tabs stay mounted once visited (`mountOnEnter`), so each list-bearing tab and each reused list is
wrapped by its screen: `<PersistentStateScopeProvider prefix="versions">`. The dev error "Two
persistent states on one screen use …" means a scope is missing.

## 5. Declare a page's main `"url"` list on its route

```ts
const { validateSearch, search } = listSearch(WIDGET_LIST_STATE);
createFileRoute("…")({ validateSearch, search, component: WidgetList });
```

Not for scoped lists or plugin pages (route files never import a plugin).

## 6. Check

`npm run lint`, `npm test`, the list's e2e specs (`e2e-local` skill), then in the browser: change
page, sort and a filter, reload, and check the address holds only what differs from the defaults
and that Back leaves the list.
