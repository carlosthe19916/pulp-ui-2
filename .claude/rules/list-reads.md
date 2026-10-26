---
paths:
  - client/src/app/queries/**
  - client/src/app/components/**
  - client/src/app/pages/**
---

# Reading lists

Every list read is **one page** of a generic list query (`use<X>ListQuery({ params })`); the
caller passes its own filters, `fields`, `ordering`, `limit` and `offset`. Pass new params to
that one hook rather than a variant that bakes them in (no `useWidgetsByOwnerQuery`); shared
params are an exported constant. [queries](queries.md) owns the one-query-per-endpoint rule.

## `limit` comes from the UI, never a literal

A hardcoded page size silently truncates a list or sizes a picker by guesswork. `limit` is one
of:

- **Count-only** — `limit: 1`, read `.count` (tab counts, dashboard cards). Never `results[0]`,
  except an **active-item probe** (e.g. "is a task running on this object?") that sets an
  explicit `ordering` and shows the sample only alongside the count.
- **Paged table** — `perPage` from `useDataViewPagination` + `ListPagination`, offset
  `(page - 1) * perPage`. Expanded-row sub-lists page too.
- **Dropdown** — `DROPDOWN_PAGE_SIZE` (`@app/constants`), `offset: 0`, with a server filter on
  the typed term (`name__icontains`) when the endpoint has one.
- **Per-page lookup** — an `__in` filter over the keys of the page on screen, with
  `limit: keys.length`.

Anything else is a violation. One row by a unique filter → detail-by-href (extra fields via
`fields`), or no `limit` in a raw request whose filter is unique (`artifacts/?sha256=`). One
row "per" table row → a `use*Queries` count probe (`limit: 1`) on the linking filter.

```ts
// ✗ magic sizes
useWidgetsListQuery({ params: { limit: 20, name__icontains: term } });

// ✓ count, table, dropdown
useWidgetPartsListQuery({ widgetHref, params: { limit: 1 } }); // reads .count
useWidgetsListQuery({
  params: { limit: perPage, offset: (page - 1) * perPage },
});
useWidgetsListQuery({
  params: { limit: DROPDOWN_PAGE_SIZE, offset: 0, name__icontains: term },
});
```

## Never fetch every page

No fetch-all helper, no `useAll*` query, no client-side join/filter/sort over a whole
collection. A list the user scrolls gets a pager, a picker searches server-side, a value the
API can't search is typed in, and data the API can't link to a row by a filter moves to that
row's detail view.

## Checklist

Pass/fail rubric for `/eval`. Check list reads in changed `queries/`, `components/` and
`pages/` files.

- [ ] List reads use the generic list query with caller-defined `params`; no new hook bakes
      params in.
- [ ] Every `limit` is `1` for a count-only read, `perPage` from pagination,
      `DROPDOWN_PAGE_SIZE` for a dropdown, or `keys.length` for a per-page `__in` lookup — no
      other literal, and no `limit: 1` read for `results[0]` except an ordered active-item
      probe that pairs it with `.count`.
- [ ] No read fetches every page: no fetch-all loop, no `useAll*` query, no client-side
      join/filter/sort over a whole collection.
