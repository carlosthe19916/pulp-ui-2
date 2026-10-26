---
name: how-content-is-viewed
description: Content is immutable and shown in three places — global list, content page, and version content with a per-ecosystem Browse view plus an All content list; a shared detail drawer; no admin download.
status: Accepted
---

# 0004. How content is viewed

## Context

A content unit is an immutable, typed record (a package, a tag, a file) that points at zero or
more artifacts (stored files). Repository versions hold content, not repositories. The API can
list a version's content but can't list every version that contains a unit. A flat list of units
is correct but unhelpful: an RPM repository is packages, advisories and module streams; a
container repository is tags pointing at manifests — shapes users already know from the
ecosystem's own sites.

## Rules

- [ ] **Content list** (global): every unit in the domain, filterable by type, label, repository
      version, orphaned state, and the difference between two versions.
- [ ] **Content page**: Details rendered for the unit's type, Artifacts (size, checksums), and
      Repositories (repositories whose _latest_ version holds it).
- [ ] **Version content** (inside a repository or version page): the content of one version, with
      **Browse** (the plugin view) and **All content** (the generic list). Plugins without a
      Browse view show only All content.
- [ ] Each Browse view is modelled on its ecosystem: Maven Central, Ansible Galaxy, Quay,
      Satellite (RPM), packages.ubuntu.com (Debian), PyPI, npmjs, rubygems.org, an S3-style path
      list (File), OSTree refs, the Hugging Face Hub. Sub-tabs show only the content types present
      in the version, with counts; with one left, the sub-tab bar is dropped.
- [ ] Every view is scoped to one version, so it works for the latest and any older version
      alike. Clicking an item opens the same per-type detail drawer everywhere (Browse, All
      content and version content share it).
- [ ] Install or pull commands show only when a distribution serves the repository.
- [ ] Added/removed-between-versions filtering lives in the All content / global list only.
- [ ] Related records are fetched in batches per page, never one request per row.
- [ ] Content is never edited in place; it is added, removed or uploaded
      ([0005](0005-how-content-is-changed.md)). No artifact download from the admin UI; downloads
      go through a distribution.

## Consequences

- The Repositories tab answers "where is this now", not "where has this ever been".
- Where the API has no "one row per package" list, versions are grouped on screen and a group can
  split across pages. Folder views (File, Maven) are prefix navigation until the API offers
  directory listings. Plugins with thin APIs (npm, OSTree) get thin views.
