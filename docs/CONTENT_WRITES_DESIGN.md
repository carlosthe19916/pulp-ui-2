# Content writes — add, remove, upload and version maintenance

Status: **designed** (2026-10-23). This is Phase 1 of
[ENDPOINT_ROADMAP.md](ENDPOINT_ROADMAP.md) (PRs 4, 5, 5b, 6). It builds on the Browse /
All content block from [REPOSITORY_CONTENT_DESIGN.md](REPOSITORY_CONTENT_DESIGN.md).

**Contents**

1. [Problem](#1-problem)
2. [Principles](#2-principles)
3. [Where actions land](#3-where-actions-land)
4. [Bulk selection](#4-bulk-selection)
5. [Modals](#5-modals)
6. [Empty states](#6-empty-states)
7. [Task feedback](#7-task-feedback)
8. [When actions show](#8-when-actions-show)
9. [Decisions](#9-decisions)
10. [API facts](#10-api-facts)

---

## 1. Problem

The UI reads content well but can't change it. The only write that puts content into a
repository is sync. Pushing a locally built package, removing a bad one, copying units between
repositories, or deleting/repairing a version all need `pulp-cli` or `curl`.

- **Content belongs to versions.** Every add/remove creates a new repository version.
- **Writes are async.** They return a task: task status → toast → refresh.
- **Upload differs per plugin.** Some plugins take a synchronous `upload/`, others an async create; OSTree imports an archive. See [§5.5](#55-uploads-per-plugin).

---

## 2. Principles

1. **Actions live where a repository is in context.** Content pages offer shortcuts into the
   same flows; the modal asks for the repository.
2. **Content changes target the latest version.** Add/remove only show when the view is the
   latest version.
3. **Every result names the version it made.** "Version 8 of my-files created", with a link.
4. **One modal per flow, many entry points.** The page fills in what it already knows.

---

## 3. Where actions land

### Repository detail

Header kebab:

```
⋮ ├ Edit
  ├ Sync
  ├ Upload content…        ← plugin has an uploadable content type
  ├ Import archive…        ← OSTree
  ├ Add content…
  ├ Remove all content…    ← disabled when the latest version is empty
  ├ Publish
  └ Delete
```

The latest content block (Details tab) gets bulk selection on every Browse view (except Maven)
and on All content. Rows open the drawer as today.

### Versions tab

Row kebab: **Restore as latest** (not on the latest), **Repair**, **Delete version** (not on
version 0).

### Repository version page

- Header kebab: Restore as latest, Repair version, Delete version (same rules).
- Content is read-only. On an older version an inline banner says "Older version. Changes apply
  to the latest version (9)." with a link.

### Content list

- Toolbar: **Upload content** (repository optional).
- Bulk selection plus toolbar button and row action: **Add to repository…**

### Content detail

- Header kebab: **Add to repository…**
- **Repositories** tab: row action **Remove from this repository**.

---

## 4. Bulk selection

Follows the PatternFly bulk-selection pattern:

```
Packages (120) │ Advisories (14) │ Module streams (3)
┌───────────────────────────────────────────────────────────────────────┐
│ [☑ 2 selected ▾]  Name [_______]  Arch [▾]     [Remove]  1–20 of 120 < >│
├───────────────────────────────────────────────────────────────────────┤
│ ☑ foo      1.0-1   x86_64   …                                         │
│ ☐ bar      2.1-3   noarch   …                                         │
│ ☑ baz      0.9-2   x86_64   …                                         │
└───────────────────────────────────────────────────────────────────────┘
```

- The bulk selector is the first toolbar item and shows the count. Menu: Select none, Select
  page. There is no Select all.
- **Remove** is a toolbar button, enabled when something is selected.
- **Selection is per view.** Paging, filtering and File folder navigation keep it. Switching a
  Browse sub-tab, or Browse ↔ All content, clears it.
- A successful change (new version) clears it. A failure keeps it for a retry.
- Only on the latest version. Maven Browse has no checkboxes (its rows are package summaries,
  not content units); Maven content is removed from All content.

### Remove confirmation

```
Remove 2 units from my-rpms?                                            ✕
───────────────────────────────────────────────────────────────────────
This creates a new version without them. Older versions keep them.

foo-1.0-1.x86_64 · baz-0.9-2.x86_64       (more than 5 → "and 12 more")
───────────────────────────────────────────────────────────────────────
                                                    [Remove]  Cancel
```

All content can mix types, so its list is grouped by type. Primary button, not danger.

### Remove all content

```
⚠ Remove all content from my-files?                                     ✕
───────────────────────────────────────────────────────────────────────
This creates a new version with no content. Older versions keep their
content. To undo, use "Restore as latest" on the previous version.

Type  my-files  to confirm
[________________________]
───────────────────────────────────────────────────────────────────────
                                                [Remove all]  Cancel
```

---

## 5. Modals

### 5.1 Upload content

```
Upload content to my-files                                              ✕
───────────────────────────────────────────────────────────────────────
  ● Uploading files ──── ○ Creating content ──── ○ Adding to my-files
───────────────────────────────────────────────────────────────────────
┌───────────────────────────────────────────────────────────────────┐
│  Drag and drop files here or  [Upload]                            │
└───────────────────────────────────────────────────────────────────┘
 foo.txt   relative path [ foo.txt     ]   12 KB   ✔
 bar.iso   relative path [ isos/bar.iso]  4.2 GB   ███████░░ 70%
 qux.txt   relative path [ qux.txt     ]    1 KB   ✖ <reason>  [Retry]
───────────────────────────────────────────────────────────────────────
                                                    [Upload]  Cancel
```

- **Repository:** inferred and not shown inside a repository page. Optional on the global
  Content list, with a warning that content outside repositories may be removed by orphan
  cleanup.
- **One version per upload:** 10 files make one new version.
- The relative path is required and unique within the batch. Large files are sent in chunks.
- **Partial failure pauses** before touching the repository:
  `⚠ 8 of 10 files are ready. 2 failed. [Retry failed] [Add 8 to my-files] [Cancel]`.
- Closing while files are uploading asks for confirmation. Once the repository step starts, the
  modal can close and the task toast takes over.

### 5.2 Add content (repository side)

Large modal, two tabs, one shared selection tray.

- **Existing content:** type select (the plugin's content types), per-type filters, selectable
  table. Units already in the repository are dimmed with an "In repository" label; a toggle
  hides them.
- **From another repository:** repository (compatible types) and version (default latest), then
  the same table. "Only content missing from my-rpms" is on by default.
- **Tray:** closable labels for every selected unit, kept across types, pages and both tabs.
- **Footer:** "Adds N units → creates a new version", plus **Overwrite matching content**
  (default on).

### 5.3 Add to repository (content side)

Small modal: repository typeahead limited to repositories that can hold the content type, a
note about the new version, overwrite checkbox.

### 5.4 Version actions

- **Restore as latest:** creates a new latest version with exactly this version's content.
- **Repair:** re-checks and re-downloads the version's artifacts.
- **Delete:** names the version that becomes latest when deleting the latest.

### 5.5 Uploads per plugin

The catalog declares each uploadable content type's mechanism and per-file fields
(`uploadable`); the Upload modal follows it. Every upload creates content without a
repository, then one `modify/` adds the batch (one version).

| Content type                 | Mechanism               | Per-file fields                         |
| ---------------------------- | ----------------------- | --------------------------------------- |
| File                         | `upload/` (synchronous) | relative path (required)                |
| RPM package                  | `upload/`               | —                                       |
| RPM advisory                 | create + task           | — (the file is the advisory JSON)       |
| Python package               | `upload/`               | —                                       |
| Python provenance            | create + task           | package href (required)                 |
| npm package                  | `upload/`               | relative path, name, version (optional) |
| Maven artifact / metadata    | `upload/`               | relative path (required)                |
| Debian package               | create + task           | relative path, distribution, component  |
| Debian generic content       | create + task           | relative path (required)                |
| Debian installer package     | create + task           | relative path                           |
| Ruby gem                     | create + task           | —                                       |
| Ansible collection version   | create + task           | expected namespace / name / version     |
| Ansible collection signature | create + task           | signed collection href (required)       |
| OpenPGP public key           | create + task           | —                                       |

Async creates show "Processing…" per file while the task runs.

**OSTree** imports an archive instead: the "Import archive…" modal uploads the tarball
as an artifact (an existing artifact with the same SHA-256 is reused), then calls
`import_all/`, or `import_commits/` when a ref is given.

**No upload:** container (images are pushed through the registry or built with
`build_image/`, roadmap PR 11) and Hugging Face (synced from the Hub).

---

## 6. Empty states

Empty states only say what's empty. They offer no actions: every action is already in
the toolbar or header menu next to them.

| Where                                 | Title                      |
| ------------------------------------- | -------------------------- |
| Repository with no content            | No content in my-files yet |
| Version with no content               | Version 3 has no content   |
| Content list, nothing matches         | No content found           |
| Content detail → Repositories         | Not in any repository      |
| Add content → Existing content        | No content to add          |
| Add content → From another repository | Nothing missing            |

A Browse sub-tab is never empty without a filter (empty sections are hidden).

------------------------------------- | -------------------------- | --------------------------------------------------- |
| Repository with no content | No content in my-files yet | Upload (primary if uploadable) / Sync / Add content |
| Older version with no content | Version 3 has no content | Go to latest version |
| Content list, empty domain | No content in this domain | Upload content |
| Content detail → Repositories | Not in any repository | Add to repository |
| Add content → Existing content | No content to add | — |
| Add content → From another repository | Nothing missing | Show all content |

A Browse sub-tab is never empty without a filter (empty sections are hidden).

---

## 7. Task feedback

1. **Started:** info toast ("Removing 2 units from my-rpms"), linking to the task.
2. **Running:** an inline info alert above the content block whenever any task runs on the
   repository (our modify, a sync, anything). Write actions and header items are disabled with
   the tooltip "Wait for the running task to finish". Browsing keeps working.
3. **Finished:**
   - Success: "Version 8 of my-rpms created", linking to the version. The block refreshes.
   - No change (nothing to add/remove): "No changes. my-rpms is still at version 7."
   - Failure: error toast plus an inline alert "Nothing changed. my-rpms is still at version 7."

Copy uses "Could not …" for failures.

---

## 8. When actions show

- **Bulk selection / Remove / Add content / Remove all:** latest version, plugin supports content
  changes. Container: only `container.container` (push repositories have no add/remove).
- **Upload:** the plugin has an uploadable content type ([§5.5](#55-uploads-per-plugin)).
- **Import archive:** OSTree repositories.
- **Restore as latest:** plugins with `modify/` (not container).
- **Everything:** disabled while a task runs on the repository. Permission-based hiding comes
  with PR 9.

---

## 9. Decisions

| #   | Topic                       | Decision                                                                    |
| --- | --------------------------- | --------------------------------------------------------------------------- |
| 1   | Where bulk select appears   | Every Browse view (except Maven) + All content, latest version only         |
| 2   | Selection scope             | Per view, cleared on sub-tab or Browse ↔ All content switch                 |
| 3   | Upload without a repository | Allowed on the global Content list; inferred inside a repository page       |
| 4   | Add content sources         | Existing content + From another repository                                  |
| 5   | "Only content missing"      | On by default in From another repository                                    |
| 6   | Restore as latest           | In scope                                                                    |
| 7   | Remove all content          | Header action, type the repository name to confirm                          |
| 8   | Partial upload failure      | Pause and ask before creating the version                                   |
| 9   | Empty states                | Describe what is empty; no actions (they are in the toolbar or header menu) |
| 10  | Running tasks               | Inline alert; writes disabled while any task runs on the repository         |
| 11  | Failed write                | Inline alert "Nothing changed", selection kept                              |
| 12  | Bulk selection UI           | PatternFly bulk selector in the toolbar (no sticky bottom bar)              |

---

## 10. API facts

Verified against a local Pulp (3.122.dev):

- `modify/` with only `base_version` creates a version with exactly that version's content
  (restore). `remove_content_units: ["*"]` empties the repository.
- A modify that changes nothing completes with an empty `created_resources`; otherwise
  `created_resources[0]` is the new version href.
- Container sync repositories use `add/` / `remove/` (`content_units`); push repositories have
  neither.
- `q` combines filters: `repository_version="<a>" AND NOT repository_version="<b>"` gives content
  in A missing from B. `pulp_href__in` + `repository_version` tells which of a page's units are in
  a version.
- `content/file/files/upload/` is synchronous (201) and returns the content. Chunked: `uploads/`
  → PUT chunks with `Content-Range` → `upload/` with `upload=<href>` (no `commit/` needed).
- Every content type in §5.5 was uploaded against a local Pulp with a real file and
  added to a repository of its type with `modify/`. The create endpoints answer 202;
  the content href is the task's `created_resources[0]`.
- `artifacts/` rejects a file whose SHA-256 already exists; look it up with
  `artifacts/?sha256=` first. OSTree `import_all/` takes `{artifact, repository_name}`.
