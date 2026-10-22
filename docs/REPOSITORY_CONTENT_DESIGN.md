# Repository content — per-plugin "Browse" design

Status: **built** (2026-10-22, uncommitted). Every field, filter and ordering below was checked
against `client/openapi/pulp.json`, and every plugin view was verified in the browser against
seeded local repositories. See [section 6](#6-as-built) for what changed during implementation. See [CONTENT_LIST_ENDPOINTS.md](CONTENT_LIST_ENDPOINTS.md)
for the endpoint list and [PLUGIN_ENDPOINTS.md](PLUGIN_ENDPOINTS.md) for the rest of the API.

**Contents**

1. [Shared shell](#1-shared-shell)
2. [Plugins](#2-plugins): [Maven](#maven) · [Ansible](#ansible) · [Container](#container) ·
   [RPM](#rpm) · [Debian](#debian) · [Python](#python) · [File](#file) · [npm](#npm) ·
   [Ruby gems](#ruby-gems) · [OSTree](#ostree) · [Hugging Face](#hugging-face)
3. [What the validation changed](#3-what-the-validation-changed)
4. [Decisions](#4-decisions)
5. [Architecture](#5-architecture)
6. [As built](#6-as-built)

---

## 1. Shared shell

The **Repository detail → Details** tab and the **Repository version** page both render one block:

```
Latest version content (vN)            ← "Version N" page: same block, no About / Use cards
┌─────────┬─────────────┐
│ Browse  │ All content │
└─────────┴─────────────┘
 [sub-tabs, only if the plugin has them and they have content]
 [plugin view]
```

- **Browse**: plugin view picked by the repository's `pulp_type` from a UI registry
  (like `PluginContentPanel`'s `PANEL_BY_TYPE`). If there's no entry, Browse is hidden and only
  "All content" renders, as today.
- **All content**: today's `VersionContent`, unchanged.
- **Every Browse request is scoped to the version** (`repository_version=<href>`), so the same view
  works for latest and for any older version.
- **Sub-tabs** show only if `content_summary.present` has that type. Labels carry counts. With
  one sub-tab left, the sub-tab bar is dropped.
- **Clicking an item** opens the existing side drawer, extended per plugin where noted.
- **Install/pull commands** need a distribution (base URL). Without one, show
  "Distribute this repository to get install commands".

The Details tab cards stay as they are, with per-plugin header actions:

| Plugin                                                                     | Header actions     | Tabs                                                                                                |
| -------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| ansible, container, rpm, deb, python, file, gem, npm, ostree, hugging_face | Edit · Sync · ⋮    | Details · Versions · Distributions · (+ Publications for rpm, deb, python, file, gem, hugging_face) |
| maven, container-push                                                      | Edit · ⋮ (no sync) | Details · Versions · Distributions                                                                  |

---

## 2. Plugins

### Maven

**Modeled on:** Maven Central (central.sonatype.com). **Sub-tabs:** none in v1.

```
[🔍 group:artifact …]  Sort [Group/Artifact ▾]                   1-10 of 128
▸ commons-lang3        3.17.0 · 12 versions          updated 2d ago
  org.apache.commons
▾ guava                33.3.1-jre · 8 versions       updated 5d ago
  com.google.guava
    33.3.1-jre   Oct 17      33.3.0-jre   Sep 02   …
▸ my-lib               1.1-SNAPSHOT · build 20261022.101500-4
```

Drawer (one version): GAV + packaging, description, licenses, SCM, Maven/Gradle snippet, files
(jar, pom, sources, javadoc), dependencies.

| Piece           | Request                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Counts in About | `{repo}metrics/?repository_version=` → package/version/build counts                                                           |
| List            | `{repo}packages/?repository_version=&search=&ordering=` (one row per groupId:artifactId, with `versions` + `latest_releases`) |
| Drawer details  | `content/maven/package/?repository_version=&group_id=&artifact_id=&version=`                                                  |
| Drawer files    | `content/maven/artifact/?repository_version=&group_id=&artifact_id=&version=`                                                 |

**Limits:**

- `packages/` has no `repository_version_added/removed`, so an "Added/Removed" view would have to
  use `content/maven/package/` instead.
- "Files" (Nexus tree) is deferred until pulpcore #7996 provides directory listings.
- `maven-metadata.xml` and index pages stay in All content.

---

### Ansible

**Modeled on:** Ansible Galaxy, Red Hat Automation Hub. **Sub-tabs:** Collections · Namespaces · Roles.

```
Collections (2)  Namespaces (2)  Roles (0 → hidden)
[🔍 namespace] [name] [tag ▾]  Sort [Name ▾]                         1-2 of 2
┌──────────────────────────────────────────────────────────────────────────┐
│ ansible.posix                 1.5.4           ✔ signed                    │
│ Ansible Collection targeting POSIX and POSIX-ish platforms.               │
│ posix  networking  shell  unix          requires ansible >=2.9            │
├──────────────────────────────────────────────────────────────────────────┤
│ community.crypto              2.22.0          ⚠ deprecated                │
│ …                                                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Collections**: Galaxy-style rows (`namespace.name`, version, description, tags, signed and
  deprecated badges, requires_ansible). The drawer adds the
  `ansible-galaxy collection install ns.name:ver` command, dependencies, authors, license, and
  links (docs, homepage, issues, repository).
- **Namespaces**: publisher rows (avatar, company, email, links, description) → clicking filters
  Collections by that namespace.
- **Roles**: legacy roles, `namespace.name` + version.

| Piece            | Request                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collections      | `content/ansible/collection_versions/?repository_version=&namespace=&name=&tags=&ordering=namespace,name,-version`                                                         |
| Signed badge     | `content/ansible/collection_signatures/?repository_version=&fields=signed_collection` (fetched once and matched by href, because `signed_collection` has no `__in` filter) |
| Deprecated badge | `content/ansible/collection_deprecations/?repository_version=` (matched by namespace + name)                                                                               |
| Namespaces       | `content/ansible/namespaces/?repository_version=&name__icontains=`                                                                                                         |
| Roles            | `content/ansible/roles/?repository_version=`                                                                                                                               |

**Limits:**

- There's no "one row per collection" endpoint in the REST API. A repository with many versions
  of one collection lists each version, sorted so they sit together.
- The Galaxy search (`is_highest=true`) gives true per-collection rows, but only for the
  repository's latest, distributed content (verified: `?repository_version=1` returns 0 rows). It
  can't serve the Repository version page, so lists stay on REST.
- Rendered docs (`docs-blob/`) are Galaxy-only. They're shown in the drawer for the served version
  once the proxy lands.

---

### Container

**Modeled on:** Quay.io, Docker Hub _Tags_, Harbor _Artifacts_. **Sub-tabs:** Tags · Manifests.

```
Tags (14)  Manifests (31)
[🔍 tag]  Sort [Name ▾]                                             1-10 of 14
TAG        DIGEST          TYPE         PLATFORMS                 SIZE
latest     sha256:3f1a…    multi-arch   linux/amd64, linux/arm64  71 MB  ✔ [⧉ pull]
1.27       sha256:3f1a…    multi-arch   linux/amd64, linux/arm64  71 MB  ✔
1.26       sha256:9bc0…    image        linux/amd64               68 MB
```

- **Tags** (default): tag, manifest digest, image or multi-arch, platforms (os/arch), compressed
  size, signed badge, and a `podman pull <host>/<base_path>:<tag>` copy button. The drawer shows
  platforms → per-platform digest, layers (blobs), labels, annotations.
- **Manifests**: every digest, including untagged ones, with media type, os/arch, bootable/flatpak
  flags and the tags pointing to it.

| Piece                   | Request                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Tags                    | `content/container/tags/?repository_version=&name=&ordering=name`                            |
| Their manifests         | `content/container/manifests/?pulp_href__in=<tagged_manifest…>` (1 batch per page)           |
| Platforms of multi-arch | `content/container/manifests/?pulp_href__in=<listed_manifests…>` (1 batch per page)          |
| Signed badge            | `content/container/signatures/?repository_version=&fields=signed_manifest` (matched by href) |
| Manifests tab           | `content/container/manifests/?repository_version=&digest=&media_type=`                       |

**Limits:**

- Up to 3 requests per page, all batched, never one per row.
- The Manifests tab can't sort by tag name. Tags have no `digest__in` filter, so "tags pointing
  to this manifest" means fetching the version's tags once (`fields=name,tagged_manifest`) and
  matching in the browser, or only showing them in the drawer (`tags/?digest=<manifest digest>`).
  Drawer-only is the safer default for big registries.

---

### RPM

**Modeled on:** Red Hat Satellite / Katello repository pages, Fedora Bodhi.
**Sub-tabs:** Packages · Advisories · Module streams · Package groups.

```
Packages (12,410)  Advisories (980)  Module streams (64)  Package groups (88)
[🔍 name] [arch ▾]  Sort [Name ▾]                              1-10 of 12,410
PACKAGE                              SUMMARY                     SIZE
bash-0:5.2.26-3.fc40.x86_64          The GNU Bourne Again shell  1.8 MB
```

- **Packages**: NEVRA (`name-[epoch:]version-release.arch`), summary, package size, signing key.
  The drawer shows description, license, vendor, build host/time, source RPM, requires/provides,
  changelog, and the `dnf install` command.
- **Advisories** (Satellite: _Errata_): ID, type (security/bugfix/enhancement), severity, title,
  issued date, reboot suggested. The drawer shows description, references (CVE links), and the
  affected packages from `pkglist`.
- **Module streams**: `name:stream`, version, context, arch, profiles (default marked from
  modulemd_defaults).
- **Package groups**: comps groups (id, name, description, default/visible, package count).
  Environments and categories only in All content.

| Piece          | Request                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Packages       | `content/rpm/packages/?repository_version=&name__contains=&arch=&ordering=name&fields=name,epoch,version,release,arch,summary,size_package,signing_keys,pulp_href` |
| Advisories     | `content/rpm/advisories/?repository_version=&type=&severity=&ordering=-issued_date&exclude_fields=pkglist,description` (both loaded in the drawer only)            |
| Module streams | `content/rpm/modulemds/?repository_version=&name=&ordering=name` + `content/rpm/modulemd_defaults/?repository_version=`                                            |
| Package groups | `content/rpm/packagegroups/?repository_version=` (no filters, no sort)                                                                                             |

**Limits:**

- Package rows are heavy (43 fields, incl. `files`, `changelogs`), so `fields=` is mandatory.
- Package groups can't be searched or sorted server-side.

---

### Debian

**Modeled on:** packages.ubuntu.com, Launchpad PPAs, Aptly. **Sub-tabs:** Releases · Packages · Source packages.

```
Releases (3)  Packages (4,120)  Source packages (1,030)
▾ noble (Ubuntu 24.04)   suite noble   origin Ubuntu
    main      amd64 · arm64     3,800 packages  →
    universe  amd64             320 packages    →
▸ jammy
[⧉ deb https://…/pulp/content/my-deb/ noble main universe]
```

- **Releases** (default): codename / suite / origin / version → components → architectures, each
  component linking to Packages filtered by it, plus the `deb …` sources line.
- **Packages**: package, version, architecture, section, priority, maintainer. Filter by
  release / component. The drawer shows depends/recommends, description, source, `apt install`.
- **Source packages**: source, version, format, maintainer, binaries built (`binary`), VCS links.

| Piece           | Request                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Releases        | `content/deb/releases/?repository_version=` + `release_components/?repository_version=&distribution=` + `release_architectures/?repository_version=&distribution=` |
| Packages        | `content/deb/packages/?repository_version=&package__icontains=&release_component=<href>&ordering=package`                                                          |
| Source packages | `content/deb/source_packages/?repository_version=&source=&ordering=source`                                                                                         |

**Limits:**

- "Packages per component" counts need one count request per component (`limit=1`). That's fine
  for a handful of components.
- Flat repositories (no releases) skip the Releases sub-tab automatically, since it has no content.

---

### Python

**Modeled on:** PyPI. **Sub-tabs:** none.

```
[🔍 name] [package type ▾]  Sort [Name ▾]                          1-10 of 230
requests                                          ⧉ pip install requests
  2.32.3   wheel  py3   requires_python >=3.8   Jun 2024
  2.32.3   sdist                                 Jun 2024
  2.31.0   wheel  py3                     ⚠ yanked
```

- One list of distribution files sorted by project, then version, shown grouped under the project
  name. The project header shows summary and the `pip install` command. Files show version,
  packagetype, python_version, requires_python, size, plus yanked and provenance badges.
- The drawer (PyPI "project page") shows description (markdown), classifiers, project URLs,
  license, requires_dist.

| Piece            | Request                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| List             | `content/python/packages/?repository_version=&name__contains=&packagetype=&ordering=name,-version&fields=…` |
| Yanked badge     | `content/python/yanks/?repository_version=` (matched by name + version)                                     |
| Provenance badge | `content/python/provenance/?repository_version=&package__in=<page hrefs>`                                   |

**Limits:**

- There's no "one row per project" in the REST API, so groups can split across pages.
- The PyPI simple index (`/pypi/…/simple/`) lists projects, but only what a distribution serves,
  so it can't back a version-scoped list.

---

### File

**Modeled on:** S3 console, Artifactory generic repositories. **Sub-tabs:** none.

```
my-files / isos / fedora /                         [🔍 path contains …]
NAME                                   SHA256
fedora/40/Fedora-40-x86_64.iso         9b1c…e21   ⬇
fedora/41/Fedora-41-x86_64.iso         44a0…77f   ⬇
```

- A path list with **breadcrumb prefix navigation**: clicking a path segment narrows to that
  prefix (`relative_path__startswith`). It shows sha256 and a download link via the distribution.

| Piece | Request                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| List  | `content/file/files/?repository_version=&relative_path__startswith=<prefix>&relative_path__icontains=&ordering=relative_path` |

**Limits:**

- A real folder view (immediate children only) can't be computed server-side; it needs
  pulpcore #7996 or loading everything.
- File size isn't on the content; it's on the artifact, so it's only shown in the drawer.

---

### npm

**Modeled on:** npmjs.com. **Sub-tabs:** none.

- Packages sorted by name, then version, grouped under the package name with `npm install name@ver`.
  The drawer shows the tarball path.
- Request: `content/npm/packages/?repository_version=&name=&ordering=name,-version`.

**Limits:** only `name`, `version` and `relative_path` exist. There's no description, dist-tags or
dependencies in the REST API, so it's a thin view.

---

### Ruby gems

**Modeled on:** rubygems.org. **Sub-tabs:** none.

- Gems sorted by name, then version, grouped: version, platform, prerelease badge,
  required_ruby_version, `gem install name -v ver`. The drawer shows dependencies.
- Request: `content/gem/gem/?repository_version=&name=&prerelease=&ordering=name,-version`.

---

### OSTree

**Modeled on:** `ostree refs` / `ostree log`, Fedora CoreOS release browser. **Sub-tabs:** none.

- **Branches** (refs): name (e.g. `fedora/x86_64/coreos/stable`), commit checksum. Expanding a ref
  shows commit history, walked through `parent_commit`, 10 at a time.

| Piece   | Request                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| Refs    | `content/ostree/refs/?repository_version=&name__icontains=&ordering=name`                                        |
| History | `content/ostree/commits/?pulp_href__in=<commit>` then follow `parent_commit` (one request per step, "Load more") |

**Limits:** commits have no timestamp or version fields in the API, so history shows only
checksums. Deep history costs one request per commit.

---

### Hugging Face

**Modeled on:** Hugging Face Hub (_Models · Datasets · Spaces_, _Files and versions_).
**Sub-tabs:** Models · Datasets · Spaces (only the `repo_type`s present).

- Rows are `repo_id` and revision. Expanding shows files (`relative_path`, size, last_modified)
  with `huggingface-cli download` commands.
- Request: `content/hugging_face/hugging-face/?repository_version=&repo_type=model&repo_id=&ordering=repo_id,relative_path`.

**Limits:**

- Sub-tab counts aren't in `content_summary`: all repo types are one content type. Getting them
  takes 3 `limit=1` count requests.
- Files sit flat under a repo, so groups can split across pages.

---

### Not covered

- **OpenPGP keyrings** (`core.openpgp_keyring`): the catalog has no repository entity for them,
  so there's no repository page to put Browse on.
- **ULN remotes, pull-through distributions**: these aren't repository types; their repositories
  render through the types above.

---

## 3. What the validation changed

| Finding                                                                                                                                       | Impact on the plan                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Only Maven has a "one row per package" endpoint** (`{repo}packages/`). Ansible, Python, npm, gem and Hugging Face only list versions/files. | Those views list versions sorted by name and group them visually. A group can split across pages. True grouping for Ansible/Python needs the Galaxy and PyPI APIs (proxy, PR 22a).                    |
| **Relationships are links (hrefs)**: tag → manifest, manifest → platforms, signature → collection, commit → parent.                           | Fetch them in batches with `pulp_href__in`, one request per page, never per row. Where `__in` is missing (ansible `signed_collection`), fetch the version's signatures once and match in the browser. |
| **Some content types are very heavy** (rpm package 43 fields, advisory `pkglist`).                                                            | Use `fields=` / `exclude_fields=` in lists; load the full record in the drawer.                                                                                                                       |
| **Folder views are impossible server-side** (File, Maven files).                                                                              | Use prefix-breadcrumb navigation now; a real tree waits for pulpcore #7996.                                                                                                                           |
| **Added/Removed works for every typed list** (`repository_version_added/removed`) **except Maven `packages/`**.                               | Moot for now: the toggle stays inside All content (decision 1).                                                                                                                                       |
| **Galaxy search and the PyPI index only reflect served (latest) content.**                                                                    | Browse lists use version-scoped REST everywhere. Galaxy/PyPI are drawer enrichments only.                                                                                                             |
| **Some plugins expose very little** (npm: name/version/path; ostree commits: checksum only).                                                  | Thin views. Still better than All content, but don't over-invest.                                                                                                                                     |
| **Multi-field ordering** (`namespace,name,-version`) is needed by 6 views.                                                                    | The list-param type today narrows `ordering` to one value, so it needs to accept a list. A small change in `queries/utils/listParams.ts`.                                                             |
| **Debian repository type is `deb.deb`**, not `deb.apt`.                                                                                       | Registry keys must use the catalog's repository `pulp_type`.                                                                                                                                          |

---

## 4. Decisions

| #   | Decision                                                  | Effect                                                                                                                     |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | All / Added / Removed toggle stays inside **All content** | Browse always shows the version's present content                                                                          |
| 2   | Drill-down uses the **drawer**                            | Browse passes hrefs; details render in `PluginContentPanel`                                                                |
| 3   | **Proxy first** (roadmap PR 22a), narrowed                | Lists use version-scoped REST everywhere. Galaxy/PyPI only enrich the drawer for the served version (Ansible `docs-blob/`) |
| 4   | **All plugins at once**                                   | One branch, reviewable commits in dependency order ([section 5](#5-architecture))                                          |

---

## 5. Architecture

Five layers, each with one job:

```
RepositoryDetailsTab / RepositoryVersionDetail
  └─ RepositoryContent            1. Shell: Browse | All content tabs, drawer, distribution lookup
       ├─ PluginBrowse            2. Registry: repository pulp_type → plugin definition → sub-tabs
       │    └─ <Plugin>Browse     3. Plugin file: sections = data hook + building blocks + rows
       │         └─ queries       4. Data: generic queries, caller-defined params
       ├─ VersionContent          (All content, unchanged)
       └─ ContentDrawerPanel → PluginContentPanel   5. Detail: one panel per content type
```

### 5.1 Shell: `components/RepositoryContent/`

- Replaces `<VersionContent>` in `RepositoryDetailsTab` and `RepositoryVersionDetail`. Props:
  `{ repositoryType, repositoryHref, versionHref, summary }`.
- Owns:
  - the Browse | All content tabs;
  - the drawer (`selectedHref` state → existing `ContentDrawerPanel`);
  - the serving-distribution lookup, done once with the existing distributions list query
    (`{ repository: repositoryHref, limit: 1 }`).
- Browse is hidden when the registry has no entry for the repository type.

### 5.2 Registry: `components/PluginBrowse/PluginBrowse.tsx`

Same pattern as `PANEL_BY_TYPE` in `components/PluginContentPanel/PluginContentPanel.tsx`:

```ts
const BROWSE_BY_REPOSITORY_TYPE: Record<string, IPluginBrowse> = {
  "ansible.ansible": ansibleBrowse,
  "container.container": containerBrowse,
  "container.container-push": containerBrowse,
  "rpm.rpm": rpmBrowse,
  "deb.deb": debBrowse,
  "python.python": pythonBrowse,
  "file.file": fileBrowse,
  "maven.maven": mavenBrowse,
  "npm.npm": npmBrowse,
  "gem.gem": gemBrowse,
  "ostree.ostree": ostreeBrowse,
  "hugging_face.hugging-face": huggingFaceBrowse,
};

interface IBrowseSection {
  key: string; // "tags"
  title: string; // "Tags"
  pulpTypes: string[]; // visibility + count from content_summary
  View: React.FC<IBrowseContext>;
}
interface IPluginBrowse {
  sections: IBrowseSection[];
}
interface IBrowseContext {
  versionHref: string;
  repositoryHref: string;
  distribution?: DistributionResponse; // commands, download links
  onSelect: (contentHref: string) => void; // opens the drawer
  selectedHref?: string;
}
```

`PluginBrowse` hides sections with no content in this version, labels each one with its count,
and drops the sub-tab bar when only one section is left.

### 5.3 Plugin files: `components/PluginBrowse/<Plugin>Browse.tsx`

- One file per plugin: `AnsibleBrowse`, `ContainerBrowse`, `RpmBrowse`, `DebBrowse`,
  `PythonBrowse`, `FileBrowse`, `MavenBrowse`, `NpmBrowse`, `GemBrowse`, `OstreeBrowse`,
  `HuggingFaceBrowse`.
- Each file exports:
  - its data object (`xxxBrowse`, the sections);
  - the section views;
  - pure domain helpers (`nevra()`, `gav()`, `pullCommand()`, `isMultiArch()`), unit-tested
    without React.
- **A section only composes:** it picks query params, calls a generic hook, and renders through
  building blocks. Building blocks never fetch; hooks return data, not JSX.
- A file past about 300 lines becomes a folder (`AnsibleBrowse/`).

Shape of a section (illustrative):

```tsx
const ContainerTags: React.FC<IBrowseContext> = ({ versionHref, distribution, onSelect }) => {
  const list = useBrowseListState({ sortKeys: ["name"], filters: ["name"] });
  const tags = useContentTypeListQuery({
    pulpType: "container.tag",
    params: { repository_version: versionHref, ...list.params },
  });
  const manifests = useContentTypeListQuery({
    pulpType: "container.manifest",
    params: { pulp_href__in: tags.data?.results.map((t) => t.tagged_manifest), limit: list.perPage },
  });
  return <BrowseTable state={list} query={tags} columns={…} onRowClick={onSelect} />;
};
```

### 5.4 Building blocks (same folder)

| Block                          | Job                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `useBrowseListState`           | Paging, sort and filter state → `params` to spread into any query. Built on `useColumnSort` / `useDataViewFilters` (`components/DataView`). |
| `BrowseTable`                  | Tabular sections: `DataViewTable` + toolbar + pagination + `dataViewBodyStates`                                                             |
| `BrowseDataList`               | Card-like sections (Ansible collections, namespaces): `DataList`, same toolbar and states                                                   |
| `groupByKey()` + `GroupedRows` | On-screen grouping for Python, npm, gems and Ansible versions                                                                               |
| `PathBreadcrumb`               | Prefix navigation for File (`relative_path__startswith`)                                                                                    |
| `StatusBadges`                 | Signed / deprecated / yanked / multi-arch labels                                                                                            |
| `CommandCopy`                  | Wraps the existing `Snippet`. Command text comes from plugin helpers + the distribution                                                     |

### 5.5 Data layer: generic queries, caller-defined params

No per-plugin list hooks. Three generic queries cover every Browse view:

| Query                                                   | File                      | Used for                                                                                  |
| ------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `useContentTypeListQuery({ pulpType, params })`         | `queries/content.ts`      | Every content list, and `pulp_href__in` batch lookups                                     |
| `useContentTypeAllQuery({ pulpType, params })`          | `queries/content.ts`      | Fetch-once-and-match sets (Ansible signatures/deprecations, Python yanks), with `fields=` |
| `useRepositorySubResourceQuery({ href, path, params })` | `queries/repositories.ts` | Maven `packages/` and `metrics/`; key nested under `repositoryKeys.detail(href)`          |

- **Type map** `queries/contentTypes.ts`: maps each `pulp_type` to its generated row type and
  `*ListData["query"]` type:

  ```ts
  interface IContentTypeMap {
    "container.tag": {
      row: ContainerTagResponse;
      query: ContentContainerTagsListData["query"];
    };
    "rpm.package": {
      row: RpmPackageResponse;
      query: ContentRpmPackagesListData["query"];
    };
    // …
  }
  ```

  `useContentTypeListQuery<K extends keyof IContentTypeMap>` types both the params and the rows,
  so a wrong filter name fails `npm run lint`. The endpoint path comes from the catalog `apiPath`.

- **Keys:** `contentKeys.typeList(domain, pulpType, params)` under `contentKeys.list()`, so
  existing invalidations still match.
- **Multi-field ordering** (`["namespace", "name", "-version"]`): a list-params variant that allows
  an array, next to `ListParams` in `queries/utils/listParams.ts`.
- **Galaxy** (after the proxy): `queries/galaxy.ts` with
  `useGalaxyDocsQuery({ basePath, namespace, name, version })`, for the Ansible drawer only.

### 5.6 Detail panels: `PluginContentPanel`, extended

The drawer resolves a panel by the item's content type, so Browse only passes hrefs. New panels,
following the `ContentPanelLayout` / `ContentHeader` / `FactList` pattern:

| Plugin    | New panels                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| Maven     | `maven.package` (GAV, licenses, dependencies, files)                          |
| Container | `container.tag`, `container.manifest` (platforms, layers, labels)             |
| RPM       | `rpm.advisory` (references, package list), `rpm.modulemd`, `rpm.packagegroup` |
| Debian    | `deb.release`, `deb.source_package`                                           |
| Ansible   | `ansible.namespace`, `ansible.role` (+ docs via Galaxy after the proxy)       |
| Others    | `ostree.refs` (commit history), `hugging_face.hugging-face`                   |

### 5.7 Files

```
components/
  RepositoryContent/   RepositoryContent.tsx · index.ts
  PluginBrowse/        PluginBrowse.tsx (registry) · types.ts
                       useBrowseListState.ts · BrowseTable.tsx · BrowseDataList.tsx
                       GroupedRows.tsx · PathBreadcrumb.tsx · StatusBadges.tsx · CommandCopy.tsx
                       AnsibleBrowse.tsx · ContainerBrowse.tsx · RpmBrowse.tsx · DebBrowse.tsx
                       PythonBrowse.tsx · FileBrowse.tsx · MavenBrowse.tsx · NpmBrowse.tsx
                       GemBrowse.tsx · OstreeBrowse.tsx · HuggingFaceBrowse.tsx · index.ts
  PluginContentPanel/  + the panels in 5.6
queries/
  content.ts           + content-type list query (page / all pages) + key
  contentTypes.ts      pulp_type → generated row / query types
  repositories.ts      + repository sub-resource query
  utils/listParams.ts  + multi-ordering variant
  galaxy.ts            docs-blob (after the proxy)
vite.config.ts, server/  + /pulp_ansible and /pypi proxy routes (PR 22a)
```

### 5.8 Tests

- Pure helpers per plugin: `nevra`, `gav`, pull commands, grouping, path prefixes.
- Registry: sections hide when empty, counts are correct, the sub-tab bar drops with one section.
- Type map: `npm run lint` fails on a filter or row field missing from the generated client.
- e2e: the Ansible and File repositories on the local backend.

### 5.9 Commit order (one branch)

1. Proxy routes.
2. Data layer.
3. Shell + registry + building blocks.
4. One commit per plugin, each with its drawer panels.

### 5.10 Open items

- Sample repositories for RPM, container, Python, Debian, npm and gem in the local backend.
  Without them, only Ansible and File can be checked end to end.

---

## 6. As built

What changed from section 5 while implementing:

| Change                                                                                                                                                                                         | Why                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section definitions live in `PluginBrowse/registry.ts` and pure helpers in `PluginBrowse/helpers.ts`; plugin files export only their section components                                        | The `react-refresh/only-export-components` lint rule forbids mixing components and plain exports in one file                                                                                         |
| No proxy at all; Ansible "Contents" come from `content/ansible/collection_versions/?pulp_href__in=<href>&fields=contents`                                                                      | The serializer returns `contents`/`docs_blob` only when `fields` is sent (verified live); the user ruled out proxies                                                                                 |
| No `CommandCopy`; commands use `Snippet`                                                                                                                                                       | Existing component already does it                                                                                                                                                                   |
| `GroupedRows` became a `groupBy` prop on `BrowseTable`                                                                                                                                         | Simpler; one table component                                                                                                                                                                         |
| The context carries `served` (`base_url` from the aggregate distributions list, `registry_path` from the typed detail), resolved by `RepositoryContent/useServedAt`, instead of a distribution | Browse sections don't know about distributions. The aggregate list omits `registry_path`, and the typed Python detail reports the API host, not the content URL the "Use this repository" card shows |
| Gem lists send no `fields`                                                                                                                                                                     | pulp_gem answers 500 to any `fields=` value (verified for every field)                                                                                                                               |
| Debian releases read components/architectures from `deb.release_component` / `deb.release_architecture` when the release's own lists are empty                                                 | The fixture's releases leave them `null`                                                                                                                                                             |
| Free-text filters dropped for container `media_type` and Python `packagetype`                                                                                                                  | Both are enums in the generated query types                                                                                                                                                          |
| Hugging Face sections pass `repo_type` `models` / `datasets` / `spaces`                                                                                                                        | The generated `RepoTypeEnum` values                                                                                                                                                                  |
| `useServingDistributions` moved to `client/src/app/hooks/`                                                                                                                                     | Now shared by the Repository detail and `RepositoryContent`                                                                                                                                          |
| Drawer wiring extracted to `VersionContent/ContentDrawer`                                                                                                                                      | Shared by Browse and All content                                                                                                                                                                     |

**Seeded data for verification** (local :5003 backend, `browse-demo-*`): Ansible (Galaxy, 2
collections), RPM (`rpm-modular` fixture), Debian (`ragnarok` fixture), File (fixture + 2 nested
files), container (`quay.io/pulp/test-fixture-1`, 4 tags), Python (`shelf-reader`), npm
(`left-pad`), gem (`panda`), OSTree (`small` fixture), Maven (hamcrest-core 1.1/1.3, junit
4.13.2). Hugging Face has no seed; it's covered by types only.
