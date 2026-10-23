# Endpoint roadmap — bringing the remaining REST API into the UI

Companion to [PLUGIN_ENDPOINTS.md](PLUGIN_ENDPOINTS.md) (what exists) and
[CONTENT_UI_DESIGN.md](CONTENT_UI_DESIGN.md) (content model). This doc says **where** each
endpoint goes and **in which PR**.

**Contents**

1. [Rules every PR follows](#1-rules-every-pr-follows)
2. [Page map](#2-page-map)
3. [PR plan](#3-pr-plan)
4. [Not planned](#4-not-planned)
5. [Open decisions](#5-open-decisions)

---

## 1. Rules every PR follows

- **Catalog stays data-only.** Plugin actions are declared in `@catalog` as data
  (endpoint segment, body fields, the entity they apply to), like `compatibleRemoteTypes`.
  Columns, icons and layout go in a UI registry keyed by `pulp_type`, like `PluginContentPanel`.
- **Generic first, plugin second.** Generic hooks go in `queries/<family>.ts`, plugin-only ones
  in `queries/<plugin>-<family>.ts`. Queries take hrefs.
- **One generic action modal.** Every async action (sync, modify, sign, tag, copy, repair…)
  works the same way: form → POST → task → toast → invalidate. Reuse `SyncModal`'s shape and
  `EntityTaskStatus`. Don't build one modal per action.
- **Gate on installed plugins** (`getAvailablePlugins`). Gate on permissions once PR 9 lands.
- Each PR ships unit tests and, where a backend exists, an e2e spec.

---

## 2. Page map

Existing pages, plus the new pages these endpoints need.

### Content management

| Page                                                     | Endpoints to add                                                                                                                                                                                  | PR                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Repository version detail** (`…/versions/$n`)          | `DELETE {version}` · `{version}repair/` · `{version}scan/` · `{version}rebuild_metadata/` (ansible)                                                                                               | 6, 13, 10             |
| **Repository detail** (`…/repositories/$type/$id`)       | `modify/` (add/remove) · upload into repo · `set_label/` · Access tab (`list_roles/`, `add_role/`, `remove_role/`) · plugin actions menu · plugin tabs (maven packages/metrics, python blocklist) | 4, 5, 8, 9, 10–12, 15 |
| **Repository list**                                      | bulk label                                                                                                                                                                                        | 8                     |
| **Content list** (`…/content`)                           | upload button · "Add to repository" row action                                                                                                                                                    | 5, 4                  |
| **Content detail** (`…/content/$type/$id`)               | labels · ansible docs (Galaxy `docs-blob/`)                                                                                                                                                       | 8, 22                 |
| **Remote detail / list**                                 | labels · Access tab · `from_bandersnatch/` (python create)                                                                                                                                        | 8, 9, 12              |
| **Distribution list**                                    | labels · Access · content guard picker · "Browse" (content app JSON)                                                                                                                              | 8, 9, 16, 23          |
| **Publication list**                                     | Access (`list_roles/`…)                                                                                                                                                                           | 9                     |
| **Container repositories** (existing list, push variant) | tag/untag · copy tags/manifests · sign · build_image · remove_image · migrate                                                                                                                     | 11                    |
| 🆕 **Ansible collections** (`…/ansible/collections`)     | `ansible/collections/` · `pulp_ansible/tags/` · Galaxy cross-repo search                                                                                                                          | 14, 22                |
| 🆕 **Container namespaces**                              | `pulp_container/namespaces/` + roles                                                                                                                                                              | 15                    |

### Monitoring

| Page                         | Endpoints to add                                                            | PR     |
| ---------------------------- | --------------------------------------------------------------------------- | ------ |
| **Task list / detail**       | `DELETE {task}` · `{task}profile_artifacts/` · task groups (`task-groups/`) | 17     |
| **Dashboard**                | `workers/` health · `vuln_report/` summary                                  | 17, 13 |
| 🆕 **Task schedules**        | `task-schedules/`                                                           | 17     |
| 🆕 **Vulnerability reports** | `vuln_report/`                                                              | 13     |

### System management

| Page                                 | Endpoints to add                                                                                            | PR    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----- |
| **Domains**                          | `set_label/` · `domains/migrate/`                                                                           | 8, 21 |
| 🆕 **Content guards**                | `contentguards/` + CRUD per type (rbac, composite, redirect, header, envvar_header, x509, rhsm)             | 16    |
| 🆕 **Alternate content sources**     | `acs/{file,rpm,deb}/…/` CRUD + `refresh/`                                                                   | 18    |
| 🆕 **Maintenance**                   | `orphans/cleanup/` · `repositories/reclaim_space/` · `repair/`                                              | 17    |
| 🆕 **Storage** (artifacts & uploads) | `artifacts/` list/delete · `uploads/` list/delete                                                           | 17    |
| 🆕 **Export / Import**               | `exporters/core/{pulp,filesystem}/` + `exports/` · `importers/core/pulp/` + `imports/` + `import-check/`    | 19    |
| 🆕 **Upstream Pulps**                | `upstream-pulps/` CRUD + `replicate/`                                                                       | 20    |
| 🆕 **OpenPGP keyrings**              | `repositories/core/openpgp_keyring/` + `modify/` · `distributions/core/openpgp/` · `content/core/openpgp_*` | 21    |

### Admin

| Page                   | Endpoints to add                                 | PR  |
| ---------------------- | ------------------------------------------------ | --- |
| 🆕 **Access policies** | `access_policies/` · `PATCH {policy}` · `reset/` | 21  |
| Users / Groups / Roles | nothing new                                      | —   |

---

## 3. PR plan

Six phases. Within a phase PRs are independent. A later phase depends only on the
earlier PRs listed in **Needs**. Size: S < 300 lines, M < 800, L > 800.

### Phase 1 — Change repository content (generic writes)

UI design and decisions: [CONTENT_WRITES_DESIGN.md](CONTENT_WRITES_DESIGN.md).

| PR     | Title                          | Scope                                                                                                                                                                                                                                                                                                     | Needs | Size |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| **4**  | Add/remove content (`modify/`) | `useRepositoryModifyMutation` (generic) plus a container variant (`add/`/`remove/`, `container.container` only; push repositories have none). Entry points: remove (row action on version content), add (Content list/detail → "Add to repository"). Each change creates a new version; say so in the UI. | —     | M    |
| **5**  | Upload content                 | Catalog `uploadable` (mechanism + per-file fields), one dialog. `…/upload/` (file, rpm, python, npm, maven) or async create (deb, gem, ansible, rpm advisory, python provenance, openpgp key); OSTree imports an archive. See CONTENT_WRITES_DESIGN §5.5.                                                 | —     | M    |
| **5b** | Chunked upload                 | `uploads/` → PUT chunks → `commit/` → create with `upload` href. Used automatically by PR 5 above a size threshold.                                                                                                                                                                                       | 5     | M    |
| **6**  | Version maintenance            | Version detail actions: delete version, repair version.                                                                                                                                                                                                                                                   | —     | S    |

### Phase 2 — Cross-cutting generic features

| PR    | Title                       | Scope                                                                                                                                                                                                             | Needs | Size |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| **7** | Generic action modal        | Extract `SyncModal` into one `TaskActionModal` (catalog fields → form → POST → task). Migrate sync onto it. Prerequisite for every plugin action.                                                                 | —     | M    |
| **8** | Edit labels                 | `set_label/`/`unset_label/` in `PulpLabels` (inline edit) on remote, repository, distribution, content and domain detail. Bulk label on lists later.                                                              | —     | M    |
| **9** | Object access + permissions | **Access** tab on repository/remote/distribution/publication detail (`list_roles/`, `add_role/`, `remove_role/`, reusing the user/group role pickers). A `my_permissions/` hook hides actions the user can't run. | —     | L    |

### Phase 3 — Plugin-specific actions (all on PR 7's modal)

| PR     | Title                                       | Scope                                                                                                                                                                                                                                                                        | Needs | Size |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| **10** | Catalog actions + Ansible                   | Add `actions` to the catalog repository slot (data: `{key, label, path, fields, entity}`). Ansible: `sign/`, `mark/`/`unmark/`, `copy_collection_version/`/`move_collection_version/`, `rebuild_metadata/`, `ansible/copy/`. Rendered in the repository detail actions menu. | 7     | M    |
| **11** | Container actions                           | `tag/`/`untag/`, `copy_tags/`/`copy_manifests/`, `sign/`, `build_image/`; push repo: `remove_image/`, `remove_signatures/`, `migrate/`. Tag/untag also as row actions on the Browse **Tags** view.                                                                           | 7     | M    |
| **12** | RPM / DEB / Python / Maven / OSTree actions | rpm `rpm/copy/`, `rpm/comps/`, `rpm/prune/` · deb `deb/copy/` · python `repair_metadata/`, `from_bandersnatch/` · maven `repair_*`, `build_path_index/`, `compact_path_index/` · ostree `import_all/`, `import_commits/`. Data entries only, plus a test per plugin.         | 7     | M    |
| **13** | Vulnerability scanning                      | `scan/` action (rpm, python versions) → 🆕 Vulnerability reports page (`vuln_report/`) + a version-detail badge + a dashboard card.                                                                                                                                          | 7     | M    |

### Phase 4 — Plugin-specific reads (richer detail pages)

| PR     | Title                    | Scope                                                                                                                                                                                                     | Needs | Size |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| **14** | Ansible collections page | 🆕 page using `ansible/collections/` (grouping) + `pulp_ansible/tags/` (facets) + typed `collection_versions` per collection. REST only, no proxy needed.                                                 | —     | M    |
| **15** | Plugin tabs              | Repository detail tabs from a UI registry: maven **Packages** (`packages/`, `metrics/`, `path_index_status/`), python **Blocklist** (`blocklist_entries/` list/add/delete). 🆕 Container namespaces page. | —     | M    |

### Phase 5 — System & admin pages (new, mostly CRUD on existing DataView patterns)

| PR     | Title                              | Scope                                                                                                                                                                                             | Needs | Size               |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------ |
| **16** | Content guards                     | 🆕 page: aggregate `contentguards/` + typed CRUD per guard type (catalog-like form registry). Guard picker in the distribution form.                                                              | —     | L                  |
| **17** | Monitoring & maintenance           | Tasks: delete, profile artifacts, task groups. 🆕 Task schedules (read). Dashboard: `workers/`. 🆕 Maintenance page: orphan cleanup, reclaim space, repair. 🆕 Storage page: artifacts & uploads. | —     | L (can split in 2) |
| **18** | Alternate content sources          | 🆕 page: ACS CRUD per plugin (file, rpm, deb) + `refresh/`.                                                                                                                                       | 7     | M                  |
| **19** | Export / Import                    | 🆕 pages: exporters (+ run export, list exports), importers (+ import-check, run import, list imports).                                                                                           | 7     | L                  |
| **20** | Upstream Pulps                     | 🆕 page: CRUD + `replicate/` (tech preview badge).                                                                                                                                                | 7     | M                  |
| **21** | Policies, keyrings, domain migrate | 🆕 Access policies (edit/reset). 🆕 OpenPGP keyrings (repo + distribution + key content). Domain `migrate/` action.                                                                               | 7     | M                  |

### Phase 6 — Client-facing APIs (need proxy work)

| PR      | Title               | Scope                                                                                                                                                                                                   | Needs   | Size |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---- |
| **22a** | Proxy routes        | Vite + Express: forward `/pulp_ansible`, `/pypi`, `/pulp/content` (and optionally `/v2`, `/token`).                                                                                                     | —       | S    |
| **22**  | Galaxy reads        | Ansible content detail **Docs** tab (`docs-blob/`); cross-repo search (`search/collection-versions/`: is_highest, deprecated, signed) on the collections page; `client-configuration/` in client setup. | 22a, 14 | M    |
| **23**  | Browse distribution | "Browse" on distributions using the content app JSON listing. **Blocked on pulpcore #7996** merging.                                                                                                    | 22a     | M    |

### Suggested order

```
Phase 1:  4, 5 → 5b, 6
Phase 2:  7, 8, 9          (7 unblocks phase 3 and most of phase 5)
Phase 3:  10 → 11, 12, 13
Phase 4:  14, 15
Phase 5:  16, 17, 18–21
Phase 6:  22a → 22, 23
```

Phases 1–2 deliver most of the remaining user value: changing and securing content.
Phases 3–6 are additive and can be interleaved by demand.

---

## 4. Not planned

| Endpoint                                            | Why                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `login/` (session)                                  | basic auth / OIDC already cover login                                                                 |
| Container registry `/v2/*`, `/token/`               | needs bearer tokens; REST typed lists give the same data                                              |
| PyPI `simple/`, RSS, npm/maven client APIs          | for package clients, not admins; show copy-paste client setup instead (`PluginRepositoryClientSetup`) |
| `datarepair/7272/`, `orphans/` (DELETE, deprecated) | one-off / deprecated                                                                                  |
| `livez/`, `docs/api.json`                           | ops/tooling only                                                                                      |
| Galaxy v1 roles, legacy v3 paths                    | legacy                                                                                                |

---

## 5. Open decisions

1. **Permissions model (PR 9):** hide or disable actions the user can't run? Check
   per object (`my_permissions/`) or per model (role list)?
2. **Plugin pages placement (PR 14, 15):** plugin-specific nav entries (e.g. "Ansible
   collections"), or tabs under existing pages only?
3. **Phase 5 nav:** group the new pages under _System management_, or add a
   _Maintenance_ section?
