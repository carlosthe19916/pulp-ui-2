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

- Remote, repository and distribution create/update/delete return `202` + task. Publication
  delete is a synchronous `204`.
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

## Outside the REST API

Galaxy (`/pulp_ansible/…`), the container registry (`/v2/`, bearer tokens), PyPI (`/pypi/…`)
and the content app aren't under `/api`, so the dev proxy doesn't reach them. Galaxy search and
the PyPI index only reflect served (latest) content. See
[ADR 0010](../adr/0010-rest-api-only.md).
