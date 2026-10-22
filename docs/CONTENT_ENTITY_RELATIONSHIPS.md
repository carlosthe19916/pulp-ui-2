# Content entity relationships (backend model)

How Remote, Repository, RepositoryVersion, Publication, Distribution and Content
relate, according to the Pulp OpenAPI spec (`client/openapi/pulp.json`, mirrored in
`client/src/app/client/types.gen.ts`). The examples use the `file` plugin; other
plugins have the same shape. For the screens, see [UI_ENTITIES.md](UI_ENTITIES.md).

```
Remote ──(sync; repo.remote is only a default)──▶ Repository
                                                     │ owns
                                                     ▼
                     Content ◀──M:N──  RepositoryVersion  (numbered, immutable)
                        │                            │ published as
                        ▼ 0..N                       ▼
                     Artifact                    Publication
                                                     │
   Distribution ──serves exactly one of──▶ { publication | repository (latest) | repository_version }
        └─▶ base_path / base_url  (what clients hit)
```

| Entity            | Upstream refs (by href)                                    | Notes                                                                                                  |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Remote            | none                                                       | Standalone fetch config: `url`, `policy`, TLS, proxy, timeouts                                         |
| Repository        | `remote?` (default sync source)                            | `latest_version_href`, `versions_href`, `autopublish`. Sync may override the remote                    |
| RepositoryVersion | `repository`, `base_version`                               | `number`, `content_summary`. Every sync or content change creates a new one                            |
| Publication       | `repository_version` (or `repository` = latest on create)  | Read-only `distributions[]` back-reference                                                             |
| Distribution      | one of `publication` / `repository` / `repository_version` | `base_path`, read-only `base_url`, `content_guard?`, `hidden?`                                         |
| Content           | none. Membership is held by versions                       | Immutable, typed by `pulp_type`. References 0..N Artifacts (`file.file` → 1, `container.manifest` → 0) |
| Artifact          | none                                                       | Plugin-agnostic `/artifacts/`: `file` (storage path), `size`, checksums                                |

## Consequences for the UI

- **Repository is the hub.** Versions, publications and distributions hang off it,
  so it gets a tabbed detail page.
- **Distribution's source is a union, not a single FK.** Any shared render or edit code
  has to handle all three source fields.
- **Content belongs to versions, not repositories.** Adding or removing content
  (`repositories/{type}/{id}/modify/`) creates a new version and returns a Task.
- **Membership is forward-only.** You can list a version's content (`repository_version`),
  and the repository list can filter by `latest_with_content`. There is no "every
  version containing unit X" query.
