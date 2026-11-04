---
title: Promote content
sidebar_position: 8
---

# Promote content

Move tested content through environments — Dev → Staging → Prod — the way you'd promote builds in
Artifactory.

## Two patterns

1. **One repository, many distributions.** Point a `dev`, `staging` and `prod` distribution at
   different [versions](./versions-and-rollback.md) of the same repository. Promotion = repointing
   a distribution at a newer version.
2. **Separate repositories + copy.** Keep `app-staging` and `app-releases` repositories. Open the
   target → **Actions → Add content… → From another repository**. Pulp copies **references only** —
   no file is re-uploaded or re-downloaded.

## Which to use

- Single source of truth, cheap to repoint → pattern 1.
- Strong isolation between stages, independent retention → pattern 2.

Some ecosystems have an **Advanced copy** that brings dependencies along (RPM, Debian). See the
ecosystem [tutorials](../tutorials/index.md).

:::note
Outline page — full walkthrough and screenshots to follow.
:::
