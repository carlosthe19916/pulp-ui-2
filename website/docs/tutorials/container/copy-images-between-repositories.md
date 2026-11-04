---
title: Copy images between repositories
sidebar_label: Copy between repositories
sidebar_position: 2
---

# Copy images between repositories

**Goal:** promote a tested image from one repository to another — for example from `app-staging`
to `app-release` — without pushing or downloading it again. Pulp copies **references only**, so no
bytes move. This is how you do a Harbor/Quay "promote" or an Artifactory copy.

Set up your repositories with the [Container registry tutorial](../container.mdx).

## Copy tags

Brings a tag (and the manifest it points at) into the target repository.

1. Open the **target** repository → **kebab (⋮) → Copy tags**.
2. Choose the **source repository** (and version), then list the **tag names** to copy.
3. Confirm. It runs as a [task](../../using-pulp/monitor-tasks.md) and creates a new
   [version](../../using-pulp/versions-and-rollback.md) of the target.

## Copy manifests

Copies manifests directly — useful for untagged manifests or copying by digest.

1. Target repository → **kebab (⋮) → Copy manifests**.
2. Pick the **source repository/version** and give the **digests** (and optionally **media types**)
   to copy.
3. Confirm.

## Why this is cheap

Manifests and blobs are global, deduplicated content; a copy just makes the target version
reference the same bytes. See [Promote content](../../using-pulp/promote-content.md) for the
staging→release pattern across ecosystems.

## Related

- [Tag and untag images](./tag-and-untag-images.md)
- [Container registry tutorial](../container.mdx) · plugin docs:
  [pulp_container](https://pulpproject.org/pulp_container/)
