---
title: Curate a PyPI mirror with filters
sidebar_label: Curate a mirror
sidebar_position: 3
---

# Curate a PyPI mirror with filters

**Goal:** mirror only the slice of PyPI you need, instead of all of it — the equivalent of
Artifactory include/exclude patterns on a remote repository. PyPI is enormous, so narrowing the
set keeps syncs fast and storage small.

This goes deeper than the basic **Include projects + Sync** shown in the
[Python tutorial](../python.mdx). You set these on the **Python remote**
(**Content Management → Remotes**).

## Filter fields

| Field                  | What it does                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| `includes`             | Only these projects, with version specifiers (for example `django>=4.2`). |
| `excludes`             | Projects to leave out, with specifiers.                                   |
| `package_types`        | Restrict to `sdist`, `bdist_wheel`, …                                     |
| `exclude_platforms`    | Drop platform-specific wheels you don't need (for example Windows).       |
| `keep_latest_packages` | Keep only the N newest releases of each project.                          |
| `prereleases`          | Include pre-release versions, or not.                                     |

## Steps

1. **Content Management → Remotes**, create or edit a **Python** remote with URL `https://pypi.org/`.
2. Set the filters above to describe exactly what you want. Leave `includes` empty **only** if you
   truly intend to mirror all of PyPI.
3. Pick a [download policy](../../concepts/download-policies.md) — **On demand** keeps metadata and
   fetches files lazily; **Immediate** downloads everything in the set now.
4. Create or open a repository, set its **Remote**, and **Sync**. Each sync that changes content
   makes a new [version](../../using-pulp/versions-and-rollback.md).

## Related

- [Mirror an upstream](../../using-pulp/mirror-an-upstream.md)
- [Block packages](./blocklist-packages.md) — exclude individual bad packages after the fact.
- Plugin reference: [pulp_python sync](https://pulpproject.org/pulp_python/)
