# Content in the UI

How Pulp **Content** is surfaced: what's built, what's planned, and the API limits
behind those choices. Model: Content is the _component_ (an immutable typed record),
and an Artifact is the _file_ it points at (0..N per unit). See
[CONTENT_ENTITY_RELATIONSHIPS.md](CONTENT_ENTITY_RELATIONSHIPS.md).

## Status

| Surface                      | Status  | Where                                                                        |
| ---------------------------- | ------- | ---------------------------------------------------------------------------- |
| Global Content list          | Done    | `…/content`, `ContentList` + shared `ContentDataList`                        |
| Content detail page          | Done    | `…/content/$contentType/$contentId`, tabs Details · Artifacts · Repositories |
| Version content (contextual) | Done    | `RepositoryVersionDetail` → `VersionContent` (summary, list, detail drawer)  |
| Upload dialog                | Planned | catalog already has `IContentType.uploadable`. No UI yet                     |
| Add/remove via `modify/`     | Planned |                                                                              |
| Chunked upload (`/uploads/`) | Planned | extends upload only                                                          |

## What's built

- **Global list.** Filters: type (`pulp_type__in`), label (`pulp_label_select`),
  `orphaned_for`, repository version, and version diff (added/removed between two
  versions). No column sort, because the aggregate endpoint only orders by `pk`.
- **Detail page.** The route `loader` builds the href with `buildContentHref`.
  - **Details**: a typed per-unit GET, rendered by `PluginContentPanel`, which maps each
    `pulp_type` to its own component (`FileContent`, `RpmContent`, …) and falls back to
    `BaseContent`.
  - **Artifacts**: `/artifacts/` read model (size, checksums).
  - **Repositories**: the repositories whose latest version contains the unit
    (`latest_with_content`).
- **Version content.** The same per-type panel, shown in a drawer next to the version's
  content list.
- **Not built (API limits):** download, because there is no admin download URL (an
  artifact's `file` is a storage path), and "every version containing unit X", because
  membership is forward-only.

## API facts that shape the UI

- `GET /content/` returns sparse records (`pulp_href`, `prn`, timestamps,
  `pulp_labels`, an `artifacts` map). For names and checksums, use the typed per-unit GET.
- **Upload envelope:** every uploadable type accepts exactly one of `file`, `upload`
  (chunked session href), `artifact`, or `file_url`, plus optional `repository`,
  `overwrite` and `pulp_labels`. Required extras vary by type:

  | Content type                                                               | Extra required                        |
  | -------------------------------------------------------------------------- | ------------------------------------- |
  | `rpm.package`, `gem.gem`, `deb.package`, `ansible.collection_version`, npm | none (metadata extracted)             |
  | `file.file`, `maven.artifact`, `python.python`                             | `relative_path`                       |
  | `ostree.content`                                                           | `relative_path`, `digest`, `artifact` |
  | `rpm.modulemd`, `deb.release*`                                             | type-specific JSON, no artifact       |

- About a third of content types have no POST (they come only from sync, publish or
  push). All `container.*` is push-only. The UI must hide upload for these types:
  a missing `uploadable` in the catalog means read-only.

## Upload plan

1. **Dialog (`file.file` first).** One catalog-driven dialog built on
   `EntityModalShell`: pick an installed, uploadable type, then show that type's
   `uploadable.fields`, then an optional target repository (prefilled and locked when
   opened from a repository). Submit creates a Task. Entry points: Content list and
   Repository detail.
2. **Add/remove.** A mutation over `repositories/{type}/{id}/modify/` with row actions
   on content lists. The UI should make clear that each change creates a new version.
3. **Chunked upload.** `POST /uploads/`, then PUT chunks with `Content-Range`, then
   `commit` with the sha256, then create the content from the `upload` href.
4. **More plugins.** Add `uploadable` to each plugin's content types in
   `catalog/plugins/`. Gate on installed plugins.

Permissions: nothing checks `my_permissions` yet. Upload and `modify/` should respect
RBAC once the app adopts a permissions strategy.
