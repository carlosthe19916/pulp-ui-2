---
name: upload
description: One Upload content modal driven by the content type; one version per batch; per-file progress; partial failure pauses; OSTree imports an archive.
status: Accepted
---

# 0007. One upload flow for every uploadable content type

## Context

Upload differs per plugin: some accept a file and answer immediately, others start a task,
some need extra fields, and some types can't be uploaded at all (sync or push only).

## Rules

- [ ] One **Upload content** modal; the content type decides its fields. Types without an
      upload API never offer upload.
- [ ] Inside a repository the target is implied. From the global Content list the repository is
      optional, with a warning that content outside any repository may be removed by orphan
      cleanup.
- [ ] A batch of files becomes exactly one new version.
- [ ] Progress is shown per file across three steps: uploading, creating content, adding to the
      repository. Large files are sent in chunks.
- [ ] If some files fail, the flow pauses before touching the repository and offers to retry
      them or add the ones that succeeded.
- [ ] Closing during upload asks for confirmation; once the repository step starts, the modal
      may close and the task feedback takes over.
- [ ] OSTree uses its own **Import archive** action. Container images are pushed with container
      tools, never uploaded.

## Consequences

- Half a batch is never added silently.
