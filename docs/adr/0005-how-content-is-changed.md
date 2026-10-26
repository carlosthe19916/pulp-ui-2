---
name: how-content-is-changed
description: Add, remove and upload all create one new version from the latest; older versions are read-only; one upload modal driven by the content type; confirmations and results name the new version.
status: Accepted
---

# 0005. How content is changed

## Context

Every change to a repository's content — adding, removing or uploading — creates a new, immutable
repository version; older versions keep what they had. Upload itself differs per plugin: some
accept a file and answer immediately, others start a task, some need extra fields, and some types
can't be uploaded at all (sync or push only).

## Rules

- [ ] Content actions live where a repository is in context (repository page, Versions tab,
      version page). Content pages offer shortcuts (**Add to repository**, **Remove from this
      repository**) that open the same flows and ask for the repository.
- [ ] Add, remove and upload are offered only on the latest version. An older version is
      read-only and says that changes apply to the latest, with a link. Each change, and each
      upload batch, becomes exactly one new version.
- [ ] Bulk selection is the toolbar bulk selector with Select none and Select page, never Select
      all. Selection survives paging and filtering, is cleared after a successful change or when
      switching views, and a failed change keeps it.
- [ ] **Add content** picks from existing content or from another repository's version; the latter
      shows only content missing from this repository by default.
- [ ] **Remove all content** is a header action confirmed by typing the repository name.
- [ ] Version actions: **Restore as latest** (a new latest version with that version's content),
      **Repair**, **Delete**. Version 0 can't be deleted; the latest can't be restored.
- [ ] **Upload content** is one modal; the content type decides its fields, and types without an
      upload API never offer it. Inside a repository the target is implied; from the global
      Content list the repository is optional, with a warning that content outside any repository
      may be removed by orphan cleanup. OSTree uses its own **Import archive** action; container
      images are pushed with container tools, never uploaded.
- [ ] Upload shows progress per file across three steps — uploading, creating content, adding to
      the repository — with large files sent in chunks. If some files fail, the flow pauses before
      touching the repository and offers to retry them or add the ones that succeeded; half a
      batch is never added silently. Closing during upload asks for confirmation; once the
      repository step starts, the modal may close and task feedback takes over
      ([0006](0006-async-task-feedback.md)).
- [ ] Every confirmation says a new version is created and older versions keep their content.
      Every result names the version it made ("Version 8 of my-files created"), with a link.
- [ ] Plugins that can't change content show no content actions.

## Consequences

- Any change can be undone by restoring a previous version.
