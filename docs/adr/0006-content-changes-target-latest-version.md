---
name: content-changes-target-latest-version
description: Add/remove content only on the latest version; bulk selection rules; Add content sources; Remove all; version actions; results name the new version.
status: Accepted
---

# 0006. Content changes create a version from the latest

## Context

Every change to a repository's content creates a new, immutable repository version. Older
versions keep what they had.

## Rules

- [ ] Content actions live where a repository is in context (repository page, Versions tab,
      version page). Content pages offer shortcuts (**Add to repository**, **Remove from this
      repository**) that open the same flows and ask for the repository.
- [ ] Add and remove are offered only on the latest version. An older version is read-only and
      says that changes apply to the latest, with a link.
- [ ] Bulk selection is the toolbar bulk selector with Select none and Select page, never
      Select all.
- [ ] Selection survives paging and filtering, and is cleared when switching views or after a
      successful change. A failed change keeps it.
- [ ] **Add content** picks from existing content or from another repository's version; the
      latter shows only content missing from this repository by default.
- [ ] **Remove all content** is a header action confirmed by typing the repository name.
- [ ] Version actions: **Restore as latest** (a new latest version with that version's
      content), **Repair**, **Delete**. Version 0 can't be deleted; the latest can't be
      restored.
- [ ] Every confirmation says a new version is created and older versions keep their content.
- [ ] Every result names the version it made ("Version 8 of my-files created"), with a link.
- [ ] Plugins that can't change content show no content actions.

## Consequences

- Any change can be undone by restoring a previous version.
