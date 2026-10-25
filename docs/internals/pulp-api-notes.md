# Pulp API notes

Behaviour of the Pulp REST API that isn't obvious from the spec, verified against a local
backend. Paths drop the `/api/pulp/{domain}/api/v3/` prefix.

## Lists

- Aggregate lists (`repositories/`, `content/`, …) return sparse, untyped rows and the generic
  `content/` sorts only by `pk`. Use the typed list (`content/<plugin>/<type>/`) for fields,
  type filters and `ordering`.
- Typed content lists filter by `repository_version=<href>` (also `_added` / `_removed`).
  `?repository=` and `?repository_name=` return `400 Invalid Filter`.
- A version's `content_summary.present[type].href` is already the typed list URL for that
  version.
- Membership is forward-only: a version lists its content, and repositories filter by
  `latest_with_content`, but nothing answers "every version containing unit X".
- `q` combines filters: `repository_version="<a>" AND NOT repository_version="<b>"` is the
  content in A missing from B.
- Related records are hrefs. Fetch them in one batch per page with `pulp_href__in`, never per
  row. `pulp_href__in` rejects integer pks (users, groups: use `id__in`), and an empty `__in`
  is ignored, so guard it.
- Heavy types (rpm package, advisory `pkglist`) need `fields=` / `exclude_fields=` in lists.
  Ansible `contents` / `docs_blob` are returned only when asked for with `fields=`.
  pulp_gem answers 500 to any `fields=`.

## Writes

- Repository and remote create are synchronous (`201` + object); distribution and
  publication create return `202` + task. Updates declare `200 | 202`, deletes `202`, except
  publication delete, a synchronous `204`.
- `modify/` creates a new version. With only `base_version` it restores that version's
  content; `remove_content_units: ["*"]` empties the repository. A no-op finishes with empty
  `created_resources`; otherwise `created_resources[0]` is the new version.
- Container has no `modify/`: sync repositories use `add/` / `remove/` (`content_units`),
  push repositories have neither. Maven has no `sync/`.
- Upload: `content/<type>/upload/` is synchronous (`201` + content) for file, rpm, python,
  npm and maven. Other uploadable types `POST` to the collection (`202` + task; content is
  `created_resources[0]`). Chunked: `uploads/` → `PUT` chunks with `Content-Range` →
  `upload/` with `upload=<href>`.
- `artifacts/` rejects a file whose sha256 already exists; look it up with
  `artifacts/?sha256=` first. OSTree `import_all/` takes `{artifact, repository_name}`.
- About a third of content types have no create endpoint (sync/push only). All `container.*`
  is push-only.

## Tasks

- States: `waiting`, `running`, `canceling`, and the final `completed`, `failed`, `canceled`,
  `skipped`.
- Cancel is `PATCH {task_href}` with `{"state": "canceled"}` (`409` if it can't be canceled).
  `DELETE {task_href}` deletes the task record.
- `tasks/?reserved_resources=<prn>` lists the tasks holding a lock on an object.
- `error.description` can be a generic message when the server redacts unsafe exceptions.

## Errors and permissions

- The spec declares no error bodies. They are DRF defaults: `400 {"field": ["msg"],
"non_field_errors": [...]}`, `403` / `404 {"detail": "..."}`.
- RBAC scopes querysets, so an object the user can't see answers `404`, not `403`.
- `{href}my_permissions/` returns the user's codenames on one object
  (`file.change_filerepository`), including those from domain- and model-level roles. No
  endpoint answers "may I create?".

## Filters

- `q` takes `NOT` / `AND` / `OR` / parentheses over the endpoint's other filters, with quoted
  values, up to a complexity of 8 (each filter, `NOT` and `AND`/`OR` chain counts one).
  `ordering` can't go inside it.
- `pulp_label_select`: `k=v`, `k!=v`, `k~substr` (case-insensitive), `k`, `!k`; commas AND
  the terms. Labels change through `set_label/` (`{key, value}`) and `unset_label/` (`{key}`).

## Outside the REST API

Galaxy (`/pulp_ansible/…`), the container registry (`/v2/`, bearer tokens), PyPI (`/pypi/…`)
and the content app aren't under `/api`, so the dev proxy doesn't reach them. Galaxy search and
the PyPI index only reflect served (latest) content. See
[ADR 0010](../adr/0010-rest-api-only.md).
