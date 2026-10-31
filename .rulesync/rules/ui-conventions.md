---
name: ui-conventions
description: "Apply when building or changing UI in pages/ or components/: use the shared table, modal and detail helpers, and follow where this project departs from PatternFly defaults (no red actions, no empty-state actions, disabled not hidden)."
root: false
targets: ["claudecode", "cursor"]
globs:
  [
    "client/src/app/pages/**",
    "client/src/app/components/**",
    "client/src/app/forms/**",
  ]
---

# UI conventions (`components/`, `pages/`)

This rule covers where the project departs from PatternFly defaults and which shared helpers
to use; generic PatternFly usage (imports, composition, tokens) is out of its scope.

## Layout

- Tables: `@patternfly/react-data-view` with `dataViewBodyStates`, `ListPagination`,
  `useColumnSort` / `buildThSort` (sketch below); paging, sorting and filtering are
  server-side. `useDataViewPagination({ perPage: 10 })` by default, never above 20
  (`ListPagination` caps it to bound per-row task probes).
- Text filters go through `useDebouncedValue`; long cells use the column's
  `modifier: "truncate"`; data column `width`s sum to 100, action columns stay unsized.

```tsx
const pagination = useDataViewPagination({ perPage: 10 });
const { ordering, sortProps } = useColumnSort({
  columnKeys: SORTABLE_COLUMN_KEYS, // from the endpoint's ordering enum
  initialSort: { sortBy: "name", direction: "asc" },
  onSortChange: () => pagination.onSetPage(undefined, 1),
});
const { filters, onSetFilters, clearAllFilters } =
  useDataViewFilters<IWidgetFilters>({});
const debouncedName = useDebouncedValue({ value: filters.name });

const { data, isLoading, error } = useWidgetsListQuery({
  params: {
    limit: pagination.perPage,
    offset: (pagination.page - 1) * pagination.perPage,
    ordering,
    name__icontains: debouncedName || undefined,
  },
});

const columns: DataViewTh[] = [
  { cell: "Name", props: { sort: sortProps("name"), width: 60 } },
  { cell: "Owner", props: { width: 40 } },
  { cell: "" }, // actions: unsized
];

const { activeState, bodyStates } = dataViewBodyStates({
  columnCount: columns.length,
  isLoading,
  error,
  isEmpty: (data?.results ?? []).length === 0,
  emptyState: (
    <TableEmptyState
      title="No widgets found"
      isFiltered={Boolean(debouncedName)}
      onClearFilters={clearAllFilters}
    />
  ),
});

return (
  <>
    <DocumentTitle title="Widgets" />
    <PageSection>
      <Content component={ContentVariants.h1}>Widgets</Content>
    </PageSection>
    <PageSection>
      <DataView activeState={activeState}>
        <DataViewToolbar
          clearAllFilters={clearAllFilters}
          filters={
            <DataViewFilters
              values={filters}
              onChange={(_key, next) => {
                onSetFilters(next);
                pagination.onSetPage(undefined, 1);
              }}
            >
              <DataViewTextFilter filterId="name" title="Name" />
            </DataViewFilters>
          }
          pagination={
            <ListPagination
              variant={PaginationVariant.top}
              itemCount={data?.count ?? 0}
              pagination={pagination}
            />
          }
        />
        <DataViewTable
          aria-label="Widgets table"
          columns={columns}
          rows={rows}
          bodyStates={bodyStates}
        />
      </DataView>
    </PageSection>
  </>
);
```

- List and detail pages put the header in its own `<PageSection>` and render
  `<DocumentTitle>`. A tab's content never renders a `<PageSection>`; `Tabs` whose content
  runs queries set `mountOnEnter`.
- Expanded-row content goes in `RevealCellOnExpand`; detail fields in `EntityDetailFields`;
  confirmations in `ConfirmActionModal`, never a hand-rolled `Modal`.
- No inline `style` or custom CSS where a PatternFly component, layout or token exists.

## Departures from PatternFly defaults

- **Never red** on row actions, header kebab items or toolbar buttons: no `isDanger: true`,
  no `variant="danger"`. Danger alerts and toasts for errors are fine.
- `ConfirmActionModal`'s default `confirmVariant="danger"` is only for an irreversible delete;
  every other confirmation (content removal, version actions, task cancel, reset) passes
  `confirmVariant="primary"`.
- **Empty states carry no actions**: `TableEmptyState` / DataView body states, title naming
  what is empty, only **Clear filters** for filtered results. `EmptyStateActions` only in
  `RouteErrorFallback`.
- **Disabled, not hidden**: object actions spread `disabledProps(verb)` from
  `useObjectPermissions({ href })` instead of rendering on `can(verb)`. Inline micro-controls
  (a label's close button) may be omitted. No loading gate: `can` is `true` until data loads.

## Tasks

- Task status on rows and pages comes from `useResourceTasks` + `ResourceTaskStatus` /
  `EntityTaskStatus`, never from local "pending" flags alone.
- Repository content writes and header actions spread `lockedProps` from
  `useRepositoryActivity` so they are disabled while a task runs on the repository. Edit is
  the exception: Pulp queues an update behind the task, so Edit stays enabled and the edit
  page shows `EditDuringTaskAlert` instead.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `pages/` and `components/`.

- [ ] Tables: react-data-view helpers, server-side paging/sorting/filtering, `perPage` 10
      (≤ 20), debounced text filters, `truncate`, widths summing to 100.
- [ ] Header in its own `<PageSection>` + `<DocumentTitle>`; tab content has no
      `<PageSection>`; query-running tabs use `mountOnEnter`.
- [ ] `RevealCellOnExpand`, `EntityDetailFields`, `ConfirmActionModal` used where they apply;
      no custom styling where PatternFly has an equivalent.
- [ ] No red row actions, menu items or toolbar buttons; danger confirm only for irreversible
      deletes.
- [ ] Empty states have no actions except **Clear filters**.
- [ ] Permission-gated actions are disabled via `disabledProps`, not hidden.
- [ ] Task status is server-derived; repository writes honour `useRepositoryActivity`.
