# Content in the UI — design

Status: **design, not yet implemented** · 2026-10-20

How Pulp **Content** should be surfaced in the UI — read (visualization) and write
(upload). Grounded in `client/openapi/pulp.json` and the generated client types.

Related: [CONTENT_ENTITY_RELATIONSHIPS.md](CONTENT_ENTITY_RELATIONSHIPS.md),
[UI_ENTITIES.md](UI_ENTITIES.md), [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. UI design

Content gets **two read surfaces and one write dialog**: a global page, the
existing contextual view, a detail drawer, and a generic upload dialog. Model:
Content = _component_, Artifact = the _file(s)_ it points at (the Nexus
Component/Asset split).

### 1.1 Global Content page (new — primary read surface)

Domain-scoped page at `/content-management/$pulpDomain/content` with a nav item in
pipeline order (Remotes → Repositories → Publications → Distributions → Content).

- DataView over all content in the domain. Columns: **Type**, **Identifier**,
  **Created** (the only fields the list API returns — see §2.1).
- Filters: type, repository version, label, free-text. **No column sort** (API
  limitation, §2.1).
- Primary action **Upload** (§1.4). Row: **Add to repository** / **Remove** (§2.3),
  open **drawer** (§1.3).

### 1.2 Contextual view (keep, already built)

`RepositoryVersionDetail`: `content_summary` cards per type + a content table
scoped to that version. Add a row **Remove from version** and open the drawer on
row click.

### 1.3 Content detail (expandable row)

Content units are immutable leaves — an **expandable row**, not a route or drawer
(the app's thin-leaf detail pattern, as Distribution/Publication use). Fetched via a
typed per-unit GET (§2.1) plus the artifact read-model:

- **Metadata** — type, relative path, created, PRN, labels.
- **Artifact** — SHA-256 (copyable) and size.

Not included: **download** (no admin download URL exists — the artifact `file` is a
storage path and the API has no download endpoint) and **membership** (no
"versions-containing-unit" query; expensive). Both deferred.

### 1.4 Upload dialog (generic, one for all plugins)

A single Artifactory-style "Deploy" dialog, catalog-driven, replacing the dead
`file.file`-only `UploadModal`:

1. **Pick content type** — only uploadable, installed types (§2.2 gating).
2. **Adaptive body** — a drag-drop file field + any type-specific fields (e.g.
   `relative_path`, ostree `digest`), or a pure metadata form for metadata-only
   types.
3. **Target repository** — optional; associate on upload → new version. Prefilled
   and locked when launched from a repository.
4. **Submit** → a Task.

Entry points: global **Upload** button on the Content page, and a contextual
**Upload** on Repository / RepositoryVersion (repository prefilled, type list
narrowed to the repo's plugin).

---

## 2. REST API consumption

### 2.1 Reading content

- **Aggregate list** `GET /content/` returns **sparse** records only —
  `MultipleArtifactContentResponse` is `{ pulp_href, prn, pulp_created,
pulp_last_updated, pulp_labels, vuln_report }`. No size, checksums, or
  `relative_path`/`name`. So list columns are limited to Type / Identifier
  (best-effort, usually the href id) / Created.
- **Filters** supported: `pulp_type`/`pulp_type__in`, `repository_version`,
  `pulp_label_select`, `q`. Per-type `name`/`sha256` exist only on typed endpoints,
  not the aggregate.
- **Sorting**: aggregate `ordering` is `pk` only → not column-sortable.
- **Rich detail** comes from a **typed per-unit GET** (generic detail-by-href),
  which carries `relative_path`, checksums, and artifact hrefs.
- **Artifacts** are read from the generic `/artifacts/` endpoint
  (`ArtifactResponse`: file/size/md5…sha512) — plugin-agnostic.
- Membership is **forward-only** (`repository_version` → units); there is no
  "versions containing unit X" filter, so cross-repo membership is expensive —
  defer or best-effort.
- Pagination is server-side with a default `limit` (the aggregate can be large).

### 2.2 Uploading content

Every uploadable package type accepts one **upload envelope**:

- **one of** `file` (direct) · `upload` (chunked session href) · `artifact`
  (pre-created href) · `file_url` (+ optional `downloader_config`),
- plus optional `repository`, `overwrite`, `pulp_labels`.

Per-plugin required fields differ (verified against `*Writable` types):

| Content type                                                                 | Extra required                        | Notes                                     |
| ---------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| `rpm.package`, `gem.gem`, `deb.package`, `ansible.collection_version`, `npm` | none (`relative_path` optional)       | Pulp extracts metadata from the file      |
| `file.file`, `maven.artifact`                                                | `relative_path`                       | generic blob — user must name the path    |
| `python.python`                                                              | `relative_path`                       | + ~30 optional PEP-621 fields (extracted) |
| `ostree.content`                                                             | `relative_path`, `digest`, `artifact` | no one-shot `file`; artifact pre-created  |
| `rpm.modulemd`, `deb.release*`                                               | type-specific JSON                    | no artifact — metadata only               |

Gating: ~⅓ of content types are **read-only** (no POST) — derived by
sync/publish/push. All `container.*` is push-only (`podman push`), never uploaded
via REST. The UI must hide upload for these.

Large files use `POST /uploads/` (create → PUT chunks with `Content-Range` →
`commit` with sha256) → create content from the `upload` href. **No chunked
infrastructure exists today** — net-new, scoped as a follow-on (§4).

### 2.3 Modifying membership

Add/remove content on a repository via `POST repositories/{type}/{id}/modify/`,
which produces a **new** version (versions are immutable). Returns a Task.

### 2.4 The catalog's role (plugin axis only)

`client/src/catalog` exists solely to model the **plugin axis** — keyed
`pulp_type → plugin`, covering the five entity types with plugin-typed endpoints
(`file/file` vs `rpm/rpm`…) and per-plugin form/detail fields: `repository`,
`remote`, `distribution`, `publication`, `content`.

`Artifact` and `RepositoryVersion` are **not** catalog concepts — single generic
endpoints, uniform response shapes, no plugin variation. They live in the generic
query/component layer.

The only catalog change needed is a minimal upload capability on the `content`
slot (required-ness already lives on each field):

```
content: {
  rest:   { apiPath: "file/files" },
  upload: {
    uploadable: true,   // false/omit -> read-only (container, derived types)
    mechanism:  "file", // "file" | "metadata" | "none"
  },
  form:   { /* fields, incl. a "file" field + required relative_path */ },
  page:   { /* detail fields for the drawer */ },
}
```

Adding an uploadable plugin stays one file in `catalog/plugins/`.

### 2.5 Permissions

The app gates writes on plugin availability only; no page consults
`my_permissions` yet. Upload and `modify/` should respect RBAC once the app adopts
a permissions strategy — out of scope here, noted so it isn't lost.

---

## 3. Background & rationale

### 3.1 What Content actually is

The assumption _"Content is files you upload to a Repository"_ is wrong in three
ways:

1. **Content attaches to a RepositoryVersion, not a Repository, many-to-many.**
   Versions are immutable, numbered snapshots; one deduplicated unit can belong to
   many versions across many repos.
2. **A content unit is not a file.** It is an immutable, typed record referencing
   0..N `Artifact`s: `file.file` → 1 artifact; `rpm.package`/`python.python` → 1
   artifact + extracted metadata; `container.manifest`, `rpm.packagegroup` → 0.
3. **Upload is one entry path among several** — sync (dominant), copy/`modify`,
   container push. Some types are only ever produced by sync/publish.

### 3.2 Entity model and current state

```
Artifact (file, size, md5…sha512)        ← typed per-unit GET only
   ▲ 0..N  referenced by
Content unit (immutable, typed by pulp_type)
   ▲ M..N  member of
RepositoryVersion ── owned by ──▶ Repository ── default ──▶ Remote
   │ published as
   ▼
Publication ── served by ──▶ Distribution ── serves ──▶ consumers (download)
```

Today Content appears only read-only inside `RepositoryVersionDetail`
(`VersionContentSummary` + `VersionContentTable`, showing Type / Identifier /
Created). No Content nav item, no `/content` route, no working upload entry point,
no cross-repository view. `components/UploadModal.tsx` is unused dead code.

### 3.3 Prior art

| Vendor      | Read                                                      | Write                             |
| ----------- | --------------------------------------------------------- | --------------------------------- |
| Nexus 3     | Browse (per-repo tree) + Search (global, Component/Asset) | per-repo format-specific upload   |
| Artifactory | repo tree + package-type views + AQL search               | one Deploy dialog (drag-drop/URL) |
| Harbor      | projects → repos → artifacts                              | registry push only                |

All ship both a repo drill-down and a global search; container is push-only
everywhere. We adopt the Component/Asset model, a global content search as the
primary read surface, and one polymorphic upload dialog.

### 3.4 Decisions

**Resolved**

- **Global + contextual** (2026-10-20). Ship the global page (§1.1) and keep the
  contextual view (§1.2); they answer different questions ("what's in this
  version?" vs "where does this file live? / upload this / audit"). Every
  comparable vendor ships both.
- **Detail = expandable row** (2026-10-20). The app has no Drawer; its thin-leaf
  detail pattern is the expandable row. Panel-only artifact detail (no dedicated
  Artifacts list).
- **No download, no membership** (2026-10-20). There is no admin download URL (the
  artifact `file` is a storage path; no download endpoint), and no
  "versions-containing-unit" query. Both deferred.

**Open**

- **v1 upload scope** — resolved by phasing (§4): `file.file` first, more plugins
  as a follow-on.

---

## 4. Implementation plan (independent phases)

Each phase builds on primitives that already exist and ships a self-contained
surface, so phases can be built and merged in **any order or in parallel**. Each
carries unit tests + an e2e spec and reuses the shared DataView loading/empty/error
states. The one real dependency (chunked upload) is isolated as an extension.

- **Phase 1 — Global Content page (read).** New `content/index.tsx` route + nav
  item + DataView over the existing `useContentListQuery`. Columns Type /
  Identifier / Created; filters per §2.1; no sort. Lift `contentIdentifier` to
  `@app/...` for reuse. _Done._

- **Phase 2 — Content detail (expandable row).** Expand a row (global list + version
  table) → a shared `ContentDetailPanel` runs a typed per-unit GET + the artifact
  read-model for relative path, SHA-256, and size. No download/membership (deferred).
  _Done._

- **Phase 3 — Upload dialog (`file.file`).** Replace dead `UploadModal` with an
  `EntityModalShell`-based dialog + a new content actions hook, reusing
  `useFileContentCreateMutation` and the `"file"` field type. Catalog gains the
  minimal `uploadable`/`mechanism` capability. Entry from Repository detail. _Write
  path, independent._

- **Phase 4 — Add/remove via `modify/`.** New mutation hook over
  `repositories/{type}/{id}/modify/` + row actions on either content table;
  surface "new version" semantics. _Independent._

- **Extension (not a peer) — chunked large-file upload.** Net-new `/uploads/`
  create → PUT → commit hook. Extends Phase 3 only.

- **Follow-on — more uploadable plugins** (rpm/python/deb/ostree/gem/npm/maven).
  One `catalog/plugins/` file each, gated by `useCreatablePlugins`. Independent
  per-plugin work once Phase 3 lands.
