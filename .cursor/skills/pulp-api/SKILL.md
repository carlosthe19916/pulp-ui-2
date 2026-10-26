---
name: pulp-api
description: Use before wiring or changing any Pulp REST call — find the operation in the OpenAPI spec or generated client, read its params and declared responses, and check Pulp's non-obvious behaviour (sync vs 202 writes, filters, q and label syntax, tasks, errors, permissions, deprecated fields).
---

# Wire a Pulp REST call

The rules code must follow are in `.rulesync/rules/pulp-api.md`. The verified API behaviour
behind them is in `docs/internals/pulp-api-notes.md`: read the section for what you're
wiring (Lists, Writes, Tasks, Errors and permissions, Filters, Outside the REST API).

## 1. Find the operation

`client/openapi/pulp.json` is the source of truth (~4 MB: grep it by path or `operationId`,
never read it whole). The generated client mirrors it and is usually faster:

```bash
grep -n "<operationId or path fragment>" client/src/app/client/sdk.gen.ts    # URL, method
grep -n "export type <Op>Data\b" -A 30 client/src/app/client/types.gen.ts    # params, body
grep -n "export type <Op>Responses\b" -A 10 client/src/app/client/types.gen.ts  # 2xx types
```

`<Op>Data["query"]` lists every query param (`UsersListData["query"]`). A plugin's endpoint
missing from the spec means the spec came from a backend without that plugin: refresh it from
one that has it, then `npm run generate`.

## 2. Check before you write code

- **Responses:** sync `201`/`200` object, `202` task, or both (`200 | 202` on most updates).
  Type `TData` to match (`.rulesync/rules/queries.md`).
- **Filters:** every filter you pass is in the operation's query params; sort keys come from
  its `ordering` enum. Aggregate lists (`repositories/`, `content/`) are sparse: use the typed
  per-plugin list for fields, type filters and ordering.
- **`q` / labels:** `q` takes `NOT` / `AND` / `OR` over the endpoint's other filters, quoted
  values, complexity ≤ 8, no ordering inside. Label filters use `pulp_label_select` (`k=v`,
  `k!=v`, `k~sub`, `k`, `!k`, comma = AND); edit labels with `set_label/` / `unset_label/`.
- **Heavy rows:** request only the columns you show with `fields=` (rpm packages, advisories);
  ansible `contents` / `docs_blob` come only when asked for. pulp_gem answers 500 to `fields=`.
- **Related records:** one `pulp_href__in` (or `id__in`) request per page, never per row; guard
  the empty list.
- **Deprecated:** skip anything marked `deprecated: true`. Current examples: rpm `gpgcheck`,
  `repo_gpgcheck`, `sqlite_metadata`, checksum-type fields; python
  `publications/python/pypi/` and `autopublish`; `TaskGroup.all_tasks_dispatched`;
  `DELETE artifacts/`.
- **Outside `/api`:** Galaxy, the container registry, PyPI and the content app aren't
  reachable through the dev proxy; don't build on them (ADR 0007).

## 3. Wire it

Reads: the `add-query` skill. Writes and their toasts: the `add-mutation` skill. Plugin
endpoints and fields: the catalog (`client/src/catalog/plugins/<plugin>.ts`).

When you verify a new quirk against a backend, add it to `docs/internals/pulp-api-notes.md`.
