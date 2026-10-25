---
paths:
  - client/src/app/pages/**
  - client/src/app/components/**
---

# UI conventions (`components/`, `pages/`)

Generic PatternFly compliance (imports, composition, tokens, no custom CSS) is the PF tooling's
job (`pf-review`). This rule covers where the project departs from PatternFly defaults and which
shared helpers to use. Toast wording and task-start toasts: `toastr.md`. When a case isn't
covered, the ADR's `## Rules` win.

## Layout

- Tables: `@patternfly/react-data-view` with `dataViewBodyStates`, `ListPagination`,
  `useColumnSort` / `buildThSort` (reference: `UserList`); paging, sorting and filtering are
  server-side. `useDataViewPagination({ perPage: 10 })` by default, never above 20
  (`ListPagination` caps it to bound per-row task probes).
- Text filters go through `useDebouncedValue`; long cells use the column's
  `modifier: "truncate"`; data column `width`s sum to 100, action columns stay unsized.
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
  `useRepositoryActivity` so they are disabled while a task runs on the repository.

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
