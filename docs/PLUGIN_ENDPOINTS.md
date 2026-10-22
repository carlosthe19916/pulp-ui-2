# Pulp plugin endpoints — what exists and what the UI could use

Research date: 2026-10-22. Sources: `client/openapi/pulp.json` (core 3.122.0.dev,
1271 operations / 923 paths) and the plugin backends in `../pulp_*/…/app/urls.py`.
Paths below drop the `/api/pulp/{pulp_domain}/api/v3` prefix.

Trigger: the old UI lists a repository's collections with
`GET content/ansible/collection_versions/?repository=<uuid>`, which fails with
`400 Invalid Filter: 'repository'`. Typed content lists filter by
**`repository_version=<href>`**, not by repository.

## 1. What our UI uses today

| Area                                                  | Endpoint(s)                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Content list                                          | aggregate `content/` only (sparse: `pulp_href`, `artifacts`, `prn`, labels, timestamps)  |
| Content detail                                        | typed `content/<apiPath>/<id>/` — one GET per row (catalog `apiPath`)                    |
| Remotes / Repositories / Distributions / Publications | aggregate list + typed CRUD on `<family>/<plugin>/<type>/`                               |
| Repository actions                                    | `sync/` and `versions/` only                                                             |
| Admin                                                 | `users/`, `groups/`, `roles/`, `domains/`, `tasks/`, `tasks/purge/`, `signing-services/` |

Nothing else is called: no `modify/`, no plugin-specific actions, no typed content lists,
no uploads, no labels/RBAC sub-resources, no ACS, no content guards.

## 2. Typed content lists vs the aggregate

The aggregate `content/` supports only generic filters: `pulp_type(__in)` (57 types),
`repository_version(_added/_removed)`, `added_between/removed_between`, `q`,
`pulp_href__in/pulp_id__in/prn__in`, `pulp_label_select`, `orphaned_for`,
`fields/exclude_fields`. It returns no type-specific fields, so you can't search
by name or version or sort by them.

Each typed list (`content/<plugin>/<type>/`) supports the same generic filters, **plus**
the type's own field filters and ordering on every model field, and returns the full typed
payload (use `fields=` to keep it small). That's how the old UI shows rich tables in one
request instead of our N+1 detail GETs.

**Plugin-neutral entry point:** `GET repositories/…/versions/<n>/` returns
`content_summary.{present,added,removed}[pulp_type].href`, which is already the typed list
URL with `?repository_version=<href>`, e.g.

```
"ansible.collection_version": { "count": 2,
  "href": "/pulp/api/v3/content/ansible/collection_versions/?repository_version=…/versions/1/" }
```

So a version page can render one typed table per present type by following those hrefs.
No plugin-specific code is needed to _find_ the endpoint, only to pick columns.

### Type-specific filters per content list

Generic filters are omitted. `__in`/`__iexact`/`__istartswith`/`__regex` variants exist where noted with `*`.

| Plugin       | Endpoint                                                                                                                                        | Filters                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ansible      | `content/ansible/collection_versions/`                                                                                                          | name, namespace, version, tags                                                                                                |
|              | `content/ansible/namespaces/`                                                                                                                   | name\*, company\*, metadata_sha256                                                                                            |
|              | `content/ansible/roles/`                                                                                                                        | name, namespace, version                                                                                                      |
|              | `content/ansible/collection_signatures/`                                                                                                        | signed_collection, pubkey_fingerprint, signing_service                                                                        |
|              | `content/ansible/collection_marks/`                                                                                                             | marked_collection, value                                                                                                      |
|              | `content/ansible/collection_deprecations/`                                                                                                      | —                                                                                                                             |
| container    | `content/container/tags/`                                                                                                                       | name, digest, media_type                                                                                                      |
|              | `content/container/manifests/`                                                                                                                  | digest, media_type, is_bootable, is_flatpak                                                                                   |
|              | `content/container/blobs/`                                                                                                                      | digest                                                                                                                        |
|              | `content/container/signatures/`                                                                                                                 | name\*, digest, key_id, manifest                                                                                              |
| rpm          | `content/rpm/packages/`                                                                                                                         | name, epoch, version, release, arch, pkgId, checksum_type, filename, sha256, signing_key                                      |
|              | `content/rpm/advisories/`                                                                                                                       | id, severity, status, type                                                                                                    |
|              | `content/rpm/modulemds/`                                                                                                                        | name, stream, version, context, arch, sha256                                                                                  |
|              | `content/rpm/modulemd_defaults/`                                                                                                                | module, stream, sha256                                                                                                        |
|              | `content/rpm/{distribution_trees,packagegroups,packagecategories,packageenvironments,packagelangpacks,repo_metadata_files,modulemd_obsoletes}/` | —                                                                                                                             |
| deb          | `content/deb/packages/`                                                                                                                         | package\*, version, architecture, section, priority, maintainer, source, release, release_component, relative_path, sha256, … |
|              | `content/deb/source_packages/`                                                                                                                  | source, version, architecture, maintainer, format, homepage, vcs_\*, …                                                        |
|              | `content/deb/releases/`                                                                                                                         | codename, suite, distribution, version, origin, label                                                                         |
|              | `content/deb/release_components/`, `release_architectures/`, `release_files/`                                                                   | component/architecture/codename, distribution, suite                                                                          |
|              | `content/deb/{package,source,installer_file}_indices/`                                                                                          | component, architecture, relative_path                                                                                        |
|              | `content/deb/installer_packages/`, `generic_contents/`, `*_release_components/`                                                                 | package/relative_path/sha256/joins                                                                                            |
| python       | `content/python/packages/`                                                                                                                      | name, version, version_specifier, filename, packagetype, author, keywords, requires_python, sha256                            |
|              | `content/python/provenance/`                                                                                                                    | package, sha256                                                                                                               |
|              | `content/python/yanks/`                                                                                                                         | —                                                                                                                             |
| file         | `content/file/files/`                                                                                                                           | relative_path\*, digest, sha256                                                                                               |
| gem          | `content/gem/gem/`                                                                                                                              | name, version, prerelease, checksum                                                                                           |
| maven        | `content/maven/artifact/`, `metadata/`                                                                                                          | group_id, artifact_id, version, filename                                                                                      |
|              | `content/maven/package/`                                                                                                                        | group_id, artifact_id, name, version, base_version, packaging, collapse_builds                                                |
| npm          | `content/npm/packages/`                                                                                                                         | name                                                                                                                          |
| ostree       | `content/ostree/refs/`                                                                                                                          | name\*, checksum                                                                                                              |
|              | `content/ostree/commits/`, `objects/`                                                                                                           | checksum                                                                                                                      |
|              | `content/ostree/{configs,summaries,content}/`                                                                                                   | —                                                                                                                             |
| hugging_face | `content/hugging_face/hugging-face/`                                                                                                            | repo_id, repo_type, revision, relative_path                                                                                   |
| core         | `content/core/openpgp_{publickey,publicsubkey,signature,userid,userattribute}/`                                                                 | fingerprint / issuer / user_id\* / sha256                                                                                     |

### Content creation / upload

| Shape                                                                                                 | Endpoints                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync upload (returns content, no task)                                                                | `content/{file/files,rpm/packages,python/packages,npm/packages,maven/artifact,maven/metadata}/upload/`                                                                                                           |
| Async create from `file` / `upload` / `artifact` / `file_url` (+ optional `repository` → new version) | ansible collection_versions & signatures, core openpgp_publickey, deb packages/installer_packages/generic_contents, file, gem, maven artifact/metadata, npm, python packages/provenance, rpm packages/advisories |
| Create from existing artifact(s) or JSON only                                                         | ansible roles/marks/deprecations, deb indices/releases/components, hugging_face, ostree content, rpm modulemds/defaults/obsoletes                                                                                |
| Chunked uploads (core)                                                                                | `uploads/` → `PUT {upload_href}` chunks → `{upload_href}commit/`, then pass `upload` to a create                                                                                                                 |
| Not uploadable via REST                                                                               | container (push via registry), ostree (use `import_all`/`import_commits`)                                                                                                                                        |

## 3. Shared patterns (every plugin)

These are uniform, so one generic hook could serve all plugins:

- **Repository** `{repo_href}modify/` — body `{add_content_units, remove_content_units, base_version}`
  (deb uses `AptRepositoryAddRemoveContent` with extra fields). Async. Every plugin except
  `container`, which uses recursive `add/`/`remove/` instead.
- **Repository version** `{version_href}repair/`, `DELETE {version_href}`.
- **Labels** `set_label/` / `unset_label/` on remotes, repositories, distributions, content, domains.
- **Object RBAC** `list_roles/`, `add_role/`, `remove_role/`, `my_permissions/` on most remotes,
  repositories, distributions, publications, content guards, tasks, uploads (not hugging_face).
- **Aggregates**: `repositories/`, `remotes/`, `distributions/`, `publications/`, `content/`,
  `contentguards/`, `repository_versions/`.

## 4. Per plugin — repository-level actions and extra resources

### ansible (`pulp_ansible`)

- Types: repository `ansible/ansible`, remotes `ansible/collection`, `ansible/role`, `ansible/git`,
  distribution `ansible/ansible`. No publications.
- Repo actions: `sync/`, `modify/`, `sign/` (AnsibleRepositorySignature), `mark/` / `unmark/`,
  `copy_collection_version/` / `move_collection_version/` (CollectionVersionCopyMove),
  `rebuild_metadata/` (also on a version).
- Other REST: `ansible/collections/` (upload, legacy), `ansible/copy/`, `pulp_ansible/tags/`,
  `{ansible_collection_import_href}` (import log), namespace `avatar/`, role `versions/`.
- **Galaxy API** (in spec, galaxy-shaped, keyed by distribution base_path):
  `pulp_ansible/galaxy/{domain}/{path}/api/v3/…`
  - `collections/`, `collections/{ns}/{name}/`, `…/versions/`, `…/versions/{v}/`, `…/docs-blob/`
    — collection-level grouping with `highest_version`, deprecation, and rendered docs.
  - `plugin/ansible/content/{base_path}/collections/index/…` and `…/namespaces/` (read/write namespaces).
  - `plugin/ansible/search/collection-versions/` — **cross-repository index**
    (filter by repository_name, distribution, namespace, name, is_highest, is_deprecated, is_signed, tags, keywords).
    The old UI uses it only for reverse dependencies (`?dependency=ns.name`). Its Collections
    page instead calls `content/ansible/collection_versions/?repository_name=…`, an unsupported
    filter (same class of bug as `?repository=`), which is why it showed 0 results.
  - `plugin/ansible/client-configuration/`, `v3/artifacts/collections/…` (download/upload).
  - Galaxy v1 roles API (`…/api/v1/roles/`) is routed in `urls.py`.

### container (`pulp_container`)

- Types: repositories `container/container`, `container/container-push` (read-only list, created by push),
  remotes `container/container`, `container/pull-through`, distributions `container/container`,
  `container/pull-through`. No publications.
- Repo actions: `sync/`, `add/` / `remove/` (recursive), `tag/` / `untag/`, `copy_tags/`,
  `copy_manifests/`, `sign/`, `build_image/` (Containerfile). Push repo: `tag/`, `untag/`,
  `remove_image/`, `remove_signatures/`, `sign/`, `migrate/` (push → regular repo).
- Other REST: `pulp_container/namespaces/` (+ RBAC).
- **Registry API (not in spec)**, `pulp_container/app/urls.py`: `token/`, `v2/`, `v2/_catalog`,
  `v2/{name}/tags/list`, `v2/{name}/manifests/{ref}`, `v2/{name}/blobs/{digest}`,
  `extensions/v2/{name}/signatures/`, flatpak `index/static|dynamic`.

### rpm (`pulp_rpm`)

- Types: repository `rpm/rpm`, remotes `rpm/rpm`, `rpm/uln`, distribution, publication `rpm/rpm`, ACS `acs/rpm/rpm/`.
- Repo actions: `sync/`, `modify/`; version `scan/` (CVE scan via osv.dev → `vuln_report/`).
- Top-level: `rpm/copy/` (dependency-aware copy between repos), `rpm/comps/` (upload comps.xml),
  `rpm/prune/` (prune old package versions).

### deb (`pulp_deb`)

- Types: repository `deb/apt`, remote `deb/apt`, distribution `deb/apt`, publications `deb/apt` and
  `deb/verbatim`, ACS `acs/deb/deb/`.
- Repo actions: `sync/`, `modify/` (Apt variant). Top-level `deb/copy/`.

### python (`pulp_python`)

- Types: repository/remote `python/python`, distribution/publication `python/pypi`.
- Repo actions: `sync/`, `modify/`, `repair_metadata/`, `blocklist_entries/` (GET/POST, + `DELETE {entry_href}`);
  version `scan/`. Remote helper `remotes/python/python/from_bandersnatch/`.
- **PyPI API** (in spec): `pypi/{domain}/{path}/simple/`, `simple/{pkg}/`, `pypi/{meta}/`
  (JSON metadata), `legacy/` (twine upload), `yank/` / `unyank/`, `rss/…`, `integrity/…/provenance/`.

### file (`pulp_file`)

- Types: repository `file/file`, remotes `file/file` and `file/git`, distribution, publication, ACS `acs/file/file/`.
- Repo actions: `sync/`, `modify/`.

### maven (`pulp_maven`)

- Types: repository/remote/distribution `maven/maven`. No publications.
- Repo actions: `modify/`, **no `sync/`** (pull-through only); `packages/` and `packages/flat/`
  (one row per group_id:artifact_id), `metrics/`, `build_path_index/`, `compact_path_index/`,
  `path_index_status/`, `repair_metadata/`, `repair_packages/`, `repair_index_pages/`.
- Other: `content/maven/maven/index-page/`. Deploy API `pulp/maven/{domain}/{name}/{path}` (GET/PUT).

### npm (`pulp_npm`)

- Types: repository/remote/distribution `npm/npm`. Repo: `sync/`, `modify/`.
- Registry API: `npm/{domain}/{path}/{package}` (PUT publish), `-/ping`, `-/whoami`.

### gem (`pulp_gem`)

- Types: repository/remote/distribution/publication `gem/gem`. Repo: `sync/`, `modify/`.

### ostree (`pulp_ostree`)

- Types: repository/remote/distribution `ostree/ostree`. No publications.
- Repo actions: `sync/`, `modify/`, `import_all/` (OstreeImportAll), `import_commits/` (OstreeImportCommitsToRef).

### hugging_face (`pulp_hugging_face`)

- Types: repository/remote/distribution/publication `hugging_face/hugging-face`.
- Repo: `sync/`, `modify/`. No object RBAC endpoints. HF Hub proxy routes in `urls.py`.

### core / certguard

- OpenPGP keyrings: `repositories/core/openpgp_keyring/` (+ `modify/`), `distributions/core/openpgp/`,
  `content/core/openpgp_*`.
- Content guards: `contentguards/core/{rbac,composite,content_redirect,header,envvar_header}/`,
  `contentguards/certguard/{x509,rhsm}/`.
- Ops: `orphans/cleanup/`, `repositories/reclaim_space/`, `repair/`, `artifacts/`, `uploads/`,
  `exporters/core/{pulp,filesystem}/` (+ `exports/`), `importers/core/pulp/` (+ `imports/`, `import-check/`),
  `upstream-pulps/` (+ `replicate/`), `task-groups/`, `task-schedules/`, `workers/`,
  `access_policies/`, `vuln_report/`, `distributions/core/artifacts/`.

## 5. Candidates worth adopting

1. **Typed content tables via `content_summary[...].href`.** This fixes the N+1 problem, enables
   search and sort by name/version, and stays plugin-neutral. Columns per `pulp_type` belong in the
   UI-layer registry (like `DETAIL_BY_TYPE`), not the catalog.
2. **`modify/`** — add/remove content from a repository. One generic hook works for every plugin
   except container (`add/`/`remove/`) and deb (extra fields).
3. **Per-plugin upload** — `…/upload/` for file/rpm/python/npm/maven; async create with
   `repository` for the rest; `uploads/` chunking for big files.
4. **Plugin-specific actions** in a catalog capability map (like `ISyncCapability`):
   ansible sign/mark/copy/move, container tag/untag/copy_tags/copy_manifests, rpm `rpm/copy/` & prune,
   python/rpm vulnerability `scan/` → `vuln_report/`.
5. **Ansible collection view** — Galaxy v3 `collections/` + `docs-blob/` and the cross-repo
   `search/collection-versions/` give a "Collection" grouping the content model can't. Only use these
   if we want a Galaxy-like browse experience. They're ansible-only and keyed by distribution `base_path`.
6. **Admin gaps** — content guards, ACS, orphan cleanup / reclaim space, exporters/importers,
   upstream replication, labels, object RBAC.
