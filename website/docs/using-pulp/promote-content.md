---
title: Promote content
sidebar_position: 8
---

# Promote content

**Goal:** move tested content through environments — Dev → Staging → Prod — the way you promote
builds in Artifactory or a CI pipeline.

## Two patterns

### 1. One repository, many distributions

Keep a single repository and expose it through a `dev`, `staging` and `prod`
[Distribution](./serve-content.md), each pinned to a different
[version](./versions-and-rollback.md). Promoting = repointing the next distribution at the version
that passed.

- Cheap, one source of truth, instant to promote and roll back.
- Best when stages differ only by "how far along" a version is.

### 2. Separate repositories + copy

Keep `app-staging` and `app-releases` repositories. To promote, open the target repository →
**Actions → Add content… → From another repository** and copy the units across. Pulp copies
**references only** — no file is re-uploaded or re-downloaded.

- Strong isolation and independent retention per stage.
- Best when stages have different access rules or lifecycles.

## Bring dependencies along

RPM and Debian offer an **Advanced copy** that resolves and copies dependencies with the package, so
a promoted repo stays installable. See the [RPM](../tutorials/rpm.mdx) and
[Debian](../tutorials/deb.mdx) tutorials.

## Related

[Versions and rollback](./versions-and-rollback.md) · [Serve content](./serve-content.md).
