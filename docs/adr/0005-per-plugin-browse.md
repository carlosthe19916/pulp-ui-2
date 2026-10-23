---
name: per-plugin-browse
description: Repository content has Browse (per-plugin view modelled on the ecosystem) and All content; version-scoped; sub-tabs only for present types.
status: Accepted
---

# 0005. Each plugin browses content the way its ecosystem does

## Context

A flat list of content units is correct but unhelpful: an RPM repository is packages,
advisories and module streams; a container repository is tags pointing at manifests. Users
know these shapes from the ecosystem's own sites.

## Rules

- [ ] A repository's content block has **Browse** (the plugin view) and **All content** (the
      generic list). Plugins without a Browse view show only All content.
- [ ] Each Browse view is modelled on its ecosystem: Maven Central, Ansible Galaxy, Quay,
      Satellite (RPM), packages.ubuntu.com (Debian), PyPI, npmjs, rubygems.org, an S3-style
      path list (File), OSTree refs, the Hugging Face Hub.
- [ ] Sub-tabs show only the content types present in the version, with counts; with one
      left, the sub-tab bar is dropped.
- [ ] Every Browse view is scoped to one version, so it works for the latest and any older
      version alike.
- [ ] Clicking an item opens the same detail drawer as All content.
- [ ] Install or pull commands show only when a distribution serves the repository.
- [ ] Added/removed-between-versions filtering lives in All content only.
- [ ] Related records are fetched in batches per page, never one request per row.

## Consequences

- Where the API has no "one row per package" list, versions are grouped on screen and a group
  can split across pages.
- Folder views (File, Maven) are prefix navigation until the API offers directory listings.
- Plugins with thin APIs (npm, OSTree) get thin views.
