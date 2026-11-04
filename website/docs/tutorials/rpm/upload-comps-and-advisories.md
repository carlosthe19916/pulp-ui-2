---
title: Upload comps, advisories and packages
sidebar_label: Upload comps & advisories
sidebar_position: 5
---

# Upload comps, advisories and packages

**Goal:** add your own package groups (comps), security advisories (errata) and packages to a hosted RPM repository.

Prerequisites: a hosted RPM repository (see the [RPM tutorial](../rpm.mdx)).

## What you can add in the UI

| Content           | How                                                          |
| ----------------- | ------------------------------------------------------------ |
| Packages (RPMs)   | **Upload content** (header action) → pick the `.rpm`.        |
| Advisories/errata | **Upload content** → upload the advisory as a JSON document. |
| Package groups    | **Kebab (⋮) → Upload comps.xml** (see below).                |

## Upload a comps.xml

1. Open the repository → **Kebab (⋮) → Upload comps.xml**.
2. Choose the `comps.xml` file. Toggle **Replace existing comps content** to overwrite rather than merge.
3. Save. `dnf group list` then shows your groups.

## What you can't upload in the UI

Modulemds (module streams), package categories/environments/langpacks and distribution (kickstart) trees are **view-only** — they arrive only by **syncing** a remote, not by upload. Browse them under the repository's **Content** tab after a sync.

:::info[Not yet in Pulp UI]
Authoring an advisory from a form (fields for CVEs, severity, affected packages) rather than uploading raw JSON — similar to erratum editors in Satellite. For now, prepare the JSON and upload it, or use the [Pulp CLI/API](https://pulpproject.org/pulp_rpm/docs/user/guides/upload-advisory/).
:::

## Related

- [Host your packages](../../using-pulp/host-your-packages.md) · [Browse content](../../using-pulp/browse-content.md)
- Depth: [pulp_rpm docs](https://pulpproject.org/pulp_rpm/)
