# Pulp API endpoints — what we use and what we don't (yet)

Sources: `client/openapi/pulp.json` and plugin source in `../pulp_*`. Checked 2026-10-22.
Paths drop the `/api/pulp/{domain}/api/v3/` prefix. `{repo}` = a repository href, etc.

**Contents**

1. [What our UI calls today](#1-what-our-ui-calls-today)
2. [Generic actions not called](#2-generic-actions-not-called)
3. [Generic GETs not called](#3-generic-gets-not-called)
4. [Plugin-specific actions](#4-plugin-specific-actions)
5. [Plugin-specific GETs](#5-plugin-specific-gets)
6. [The rest (non-REST APIs, uploads)](#6-the-rest)
7. [Gotchas](#7-gotchas)

---

## 1. What our UI calls today

| Area                                 | Calls                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Remotes, Repositories, Distributions | aggregate list · typed `POST` · `GET`/`PATCH`/`DELETE {href}`          |
| Publications                         | aggregate list · typed `POST` · `DELETE {href}`                        |
| Repository                           | `sync/` · `versions/` · `GET {version}`                                |
| Content                              | aggregate `content/` list · `GET {content}` per row · `GET {artifact}` |
| Tasks                                | list · `GET` · `PATCH` (cancel) · `tasks/purge/`                       |
| Users, Groups, Roles, Domains        | full CRUD · `{user}roles/` · `{group}users/` · `{group}roles/`         |
| Other                                | `status/` · `signing-services/` · `groups/` (login check)              |

Everything below is **not called** by our UI.

---

## 2. Generic actions not called

Same shape on every plugin, so one hook could serve them all.

| Action                    | Endpoint                                                                                                                     | Notes                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Add/remove content        | `POST {repo}modify/`                                                                                                         | `{add_content_units, remove_content_units, base_version}`. Every plugin except container. |
| Delete a version          | `DELETE {version}`                                                                                                           | async                                                                                     |
| Repair a version          | `POST {version}repair/`                                                                                                      | re-download missing/corrupt artifacts                                                     |
| Labels                    | `POST {href}set_label/` · `unset_label/`                                                                                     | remotes, repos, distributions, content, domains                                           |
| Object roles              | `POST {href}add_role/` · `remove_role/`                                                                                      | most remotes, repos, distributions, publications, guards, tasks                           |
| Delete a task             | `DELETE {task}`                                                                                                              |                                                                                           |
| Orphan cleanup            | `POST orphans/cleanup/`                                                                                                      | `{orphan_protection_time, content_hrefs}`                                                 |
| Reclaim space             | `POST repositories/reclaim_space/`                                                                                           | drop artifacts of old versions                                                            |
| Repair all                | `POST repair/`                                                                                                               | whole-system artifact repair                                                              |
| Chunked upload            | `POST uploads/` → `PUT {upload}` → `POST {upload}commit/` · `DELETE {upload}`                                                | big-file uploads                                                                          |
| Artifacts                 | `POST artifacts/` · `DELETE {artifact}`                                                                                      |                                                                                           |
| Content guards            | CRUD on `contentguards/core/{rbac,composite,content_redirect,header,envvar_header}/`, `contentguards/certguard/{x509,rhsm}/` | attach to distributions                                                                   |
| Alternate content sources | CRUD + `POST {acs}refresh/` on `acs/{file,rpm,deb}/…/`                                                                       |                                                                                           |
| Export                    | CRUD `exporters/core/{pulp,filesystem}/` · `POST {exporter}exports/`                                                         |                                                                                           |
| Import                    | CRUD `importers/core/pulp/` · `POST {importer}imports/` · `POST importers/core/pulp/import-check/`                           |                                                                                           |
| Replication               | CRUD `upstream-pulps/` · `POST {upstream}replicate/`                                                                         | tech preview                                                                              |
| Access policies           | `PATCH`/`PUT {policy}` · `POST {policy}reset/`                                                                               |                                                                                           |
| OpenPGP keyrings          | CRUD `repositories/core/openpgp_keyring/` · `modify/` · `distributions/core/openpgp/`                                        |                                                                                           |
| Domain migrate            | `POST domains/migrate/`                                                                                                      | switch a domain's storage backend                                                         |
| Session login             | `POST`/`DELETE login/`                                                                                                       | we use basic auth instead                                                                 |

---

## 3. Generic GETs not called

| Endpoint                                           | Gives                                               | Useful filters                                         |
| -------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| **Typed content lists** `content/<plugin>/<type>/` | full typed rows in one call (we do N+1 detail GETs) | `repository_version` + type fields (see below)         |
| Typed family lists `remotes/<plugin>/<type>/` etc. | typed rows with plugin fields                       | name, base_path, …                                     |
| `{href}list_roles/` · `{href}my_permissions/`      | who has access · what I can do                      | —                                                      |
| `repository_versions/`                             | versions across all repos                           | `content` (which versions contain X)                   |
| `artifacts/`                                       | artifacts                                           | `sha256`/`md5`/…, `repository_version`, `orphaned_for` |
| `uploads/`                                         | in-progress uploads                                 | size                                                   |
| `contentguards/`                                   | all guards                                          | —                                                      |
| `vuln_report/`                                     | CVE scan results                                    | `repo_versions`                                        |
| `workers/`                                         | worker health                                       | `online`, `missing`                                    |
| `task-groups/` · `task-schedules/`                 | grouped/scheduled tasks                             | `task_name`                                            |
| `{task}profile_artifacts/`                         | task profiling output                               | —                                                      |
| `access_policies/`                                 | RBAC policies                                       | `viewset_name`, `customized`                           |
| `exporters/…`, `importers/…`, `upstream-pulps/`    | lists                                               | name                                                   |
| `distributions/core/artifacts/`                    | artifact distributions                              | base_path                                              |
| `livez/` · `docs/api.json`                         | liveness · schema                                   | —                                                      |

**Tip:** a version's `content_summary.present[type].href` is already the typed list URL with
`?repository_version=…`. Follow it to get typed tables without hardcoding endpoints.

<details><summary>Type-specific filters on content lists</summary>

| Plugin       | Endpoint → filters                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ansible      | `collection_versions` → name, namespace, version, tags · `namespaces` → name, company · `roles` → name, namespace, version · `collection_signatures` → signed_collection, pubkey_fingerprint · `collection_marks` → marked_collection, value |
| container    | `tags` → name, digest, media_type · `manifests` → digest, media_type, is_bootable, is_flatpak · `blobs` → digest · `signatures` → name, digest, key_id, manifest                                                                             |
| rpm          | `packages` → name, epoch, version, release, arch, pkgId, filename, sha256, signing_key · `advisories` → id, severity, status, type · `modulemds` → name, stream, version, context, arch                                                      |
| deb          | `packages` → package, version, architecture, section, maintainer, source, release, release_component · `releases` → codename, suite, distribution · `release_components` → component                                                         |
| python       | `packages` → name, version, version_specifier, filename, packagetype, author, keywords, requires_python                                                                                                                                      |
| file         | `files` → relative_path, digest, sha256                                                                                                                                                                                                      |
| gem          | `gem` → name, version, prerelease                                                                                                                                                                                                            |
| maven        | `artifact`/`metadata` → group_id, artifact_id, version, filename · `package` → group_id, artifact_id, version, packaging                                                                                                                     |
| npm          | `packages` → name                                                                                                                                                                                                                            |
| ostree       | `refs` → name, checksum · `commits`/`objects` → checksum                                                                                                                                                                                     |
| hugging_face | `hugging-face` → repo_id, repo_type, revision, relative_path                                                                                                                                                                                 |

Every list also sorts on any model field.
</details>

---

## 4. Plugin-specific actions

| Plugin                           | Endpoint                                                              | Does                                                     |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| **ansible**                      | `{repo}sign/`                                                         | sign collections                                         |
|                                  | `{repo}mark/` · `unmark/`                                             | add/remove a mark (e.g. "approved")                      |
|                                  | `{repo}copy_collection_version/` · `move_collection_version/`         | copy/move between repos                                  |
|                                  | `{repo}rebuild_metadata/` · `{version}rebuild_metadata/`              | rebuild collection metadata                              |
|                                  | `ansible/copy/`                                                       | copy content between repos (`config` list)               |
|                                  | `ansible/collections/` (POST)                                         | upload a collection tarball                              |
| **container**                    | `{repo}add/` · `remove/`                                              | recursive add/remove (replaces `modify/`)                |
|                                  | `{repo}tag/` · `untag/`                                               | tag/untag a manifest                                     |
|                                  | `{repo}copy_tags/` · `copy_manifests/`                                | copy from another repo                                   |
|                                  | `{repo}sign/`                                                         | sign manifests                                           |
|                                  | `{repo}build_image/`                                                  | build from a Containerfile                               |
|                                  | push repo: `remove_image/` · `remove_signatures/` · `migrate/`        | delete image · drop signatures · convert to regular repo |
| **rpm**                          | `rpm/copy/`                                                           | dependency-aware copy                                    |
|                                  | `rpm/comps/`                                                          | upload comps.xml                                         |
|                                  | `rpm/prune/`                                                          | prune old package versions                               |
|                                  | `{version}scan/`                                                      | CVE scan → `vuln_report/`                                |
| **deb**                          | `deb/copy/`                                                           | copy between repos                                       |
| **python**                       | `{repo}repair_metadata/`                                              | fix package metadata                                     |
|                                  | `{repo}blocklist_entries/` (POST) · `DELETE {entry}`                  | block packages from sync                                 |
|                                  | `{version}scan/`                                                      | CVE scan → `vuln_report/`                                |
|                                  | `remotes/python/python/from_bandersnatch/`                            | create remote from a bandersnatch config                 |
| **maven**                        | `{repo}repair_metadata/` · `repair_packages/` · `repair_index_pages/` | rebuild metadata / packages / index pages                |
|                                  | `{repo}build_path_index/` · `compact_path_index/`                     | path index maintenance                                   |
|                                  | —                                                                     | **no `sync/`** (pull-through only)                       |
| **ostree**                       | `{repo}import_all/` · `import_commits/`                               | import an ostree tarball                                 |
| **file, gem, npm, hugging_face** | —                                                                     | only the generic `sync/` + `modify/`                     |

---

## 5. Plugin-specific GETs

| Plugin                                             | Endpoint                                                                         | Gives                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ansible**                                        | `ansible/collections/` ✅                                                        | distinct collections `{namespace, name}`                                                                         |
|                                                    | `pulp_ansible/tags/` ✅                                                          | tag facets `{name, count}`                                                                                       |
|                                                    | `{namespace}avatar/`                                                             | namespace logo                                                                                                   |
|                                                    | `{collection_import}`                                                            | upload import log                                                                                                |
|                                                    | `{role}versions/`                                                                | role versions                                                                                                    |
|                                                    | `galaxy/…/search/collection-versions/` ✅                                        | **cross-repo search**: repository_name, is_highest, is_deprecated, is_signed, version_range, dependency, tags, q |
|                                                    | `galaxy/…/content/{base_path}/collections/index/[{ns}/{name}/[versions/[{v}/]]]` | collections → versions → detail (download_url, signatures) per distribution                                      |
|                                                    | `galaxy/…/versions/{v}/docs-blob/` ✅                                            | rendered module docs                                                                                             |
|                                                    | `galaxy/…/content/{base_path}/namespaces/` ✅                                    | namespaces per distribution                                                                                      |
|                                                    | `galaxy/…/client-configuration/` ✅                                              | ansible-galaxy client config                                                                                     |
| **container**                                      | `pulp_container/namespaces/`                                                     | registry namespaces                                                                                              |
| **maven**                                          | `{repo}packages/`                                                                | one row per group:artifact (searchable)                                                                          |
|                                                    | `{repo}packages/flat/`                                                           | one row per build                                                                                                |
|                                                    | `{repo}metrics/`                                                                 | package / version / build counts                                                                                 |
|                                                    | `{repo}path_index_status/`                                                       | index state                                                                                                      |
| **python**                                         | `{repo}blocklist_entries/`                                                       | blocklist rules                                                                                                  |
| **rpm, deb, gem, ostree, file, npm, hugging_face** | —                                                                                | nothing beyond typed content lists                                                                               |

`galaxy/` = `/pulp_ansible/galaxy/{domain}/default/api/v3/plugin/ansible/`.
✅ = verified against the local backend.

---

## 6. The rest

### Uploading content

| Shape                                                                             | Endpoints                                                                                                              |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Sync upload (no task)                                                             | `content/{file/files, rpm/packages, python/packages, npm/packages, maven/artifact, maven/metadata}/upload/`            |
| Async create (`file` / `upload` / `artifact` / `file_url`, optional `repository`) | ansible collections & signatures, deb packages, file, gem, maven, npm, python, rpm packages & advisories, openpgp keys |
| From existing artifacts only                                                      | deb indices/releases, rpm modulemds, ostree, hugging_face, ansible roles                                               |
| Not via REST                                                                      | container (`docker push`), ostree (`import_all`)                                                                       |

### Client-facing APIs (outside `/pulp/api/v3/`)

| Plugin                                                                           | API                                                                               | Main reads                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ansible                                                                          | Galaxy v3 / v1 at `/pulp_ansible/galaxy/{domain}/{base_path}/api/`                | collections, versions, docs-blob, namespaces, artifact download                                                                                                                             |
| container                                                                        | OCI registry at `/v2/` (bearer auth via `/token/`)                                | `_catalog`, `{name}/tags/list`, manifests, blobs, signatures, Flatpak `index/static`                                                                                                        |
| python                                                                           | PyPI at `/pypi/{domain}/{base_path}/`                                             | `simple/`, `pypi/{pkg}/json/`, provenance, RSS                                                                                                                                              |
| npm                                                                              | `/npm/{domain}/{base_path}/`                                                      | `-/ping`, `-/whoami`, publish (PUT)                                                                                                                                                         |
| maven                                                                            | `/pulp/maven/{domain}/{name}/{path}`                                              | file GET/PUT (deploy)                                                                                                                                                                       |
| hugging_face                                                                     | content app proxy                                                                 | Hub API proxy, `resolve/` downloads, `content/huggingface/resolve-cache/…`                                                                                                                  |
| rpm, deb, gem, ostree, file                                                      | content app only                                                                  | repo metadata at the distribution `base_url`                                                                                                                                                |
| all (pulpcore, **[PR #7996](https://github.com/pulp/pulpcore/pull/7996), open**) | content app JSON listing at `{base_url}{subpath}` with `Accept: application/json` | `{path, packages:[{path,size,date}], count, limit, offset, next_offset?}` · `?limit` (default 1000, max 10000) / `?offset` · plugins can override via `Distribution.content_handler_json()` |

---

## 7. Gotchas

- Typed content lists filter by **`repository_version=<href>`**. `?repository=` and
  `?repository_name=` return `400 Invalid Filter`. The old UI hits both bugs, which is why its
  Collection versions tab and Collections page are broken.
- The cross-repo Galaxy search **does** accept `repository_name`.
- Galaxy, registry and PyPI APIs live outside `/pulp/api`, so our dev proxy needs extra routes
  to reach them.
- The registry needs a bearer token. With basic auth, `/v2/_catalog` returns 500 locally.
- Container has no `modify/` (use `add/`/`remove/`). Maven has no `sync/`.
