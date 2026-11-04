---
title: Versions and rollback
sidebar_position: 7
---

# Versions and rollback

Every change to a repository's content creates a new **immutable** [repository version](../concepts/entities.md).
That makes rollback and auditing easy.

## In the UI

- A repository's **Versions** tab lists every version and what changed.
- Open a version to see its content and, from the version detail page:
  - **Restore as latest** — roll the repository back to that version.
  - **Repair** — re-download/verify missing or corrupt artifacts.
  - **Delete** — remove an old version.
- If a version was scanned, a **vulnerability** alert appears.

## Keeping versions tidy

Set `retain_repo_versions` on the repository to auto-prune old versions. Versions currently being
served by a distribution are protected from pruning.

## Freezing what clients see

Point a [Distribution](./serve-content.md) at a specific version instead of the repository, so new
syncs don't change what clients get.

:::note
Outline page — full walkthrough and screenshots to follow. Reference:
[Repositories](./reference/repositories.md).
:::
