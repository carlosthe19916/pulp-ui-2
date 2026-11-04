---
title: Publications
sidebar_position: 4
---

# Publications

A publication is the generated index/metadata for a repository version — the `repomd.xml` for `dnf`,
the `Release` files for `apt`, the gem specs — the same thing Artifactory regenerates when it indexes
a repo. A [distribution](./distributions.md) then serves it.

Only some ecosystems use publications: **RPM, Debian and Gem**. Everything else (Python, Ansible,
Container, OSTree, npm, Maven, Hugging Face) serves straight from a repository version, so you skip
this step. See [The content workflow](../../concepts/content-workflow.md).

Manage publications under **Content Management → Publications**: create one from a repository version,
open it, or delete it.

## On the detail page

- **Details** — the repository version it was published from, its settings, and the distributions
  serving it.
- **Access** — grant users and groups roles on the publication.

## Common settings

Set at publish time (per plugin) — for example the RPM metadata checksum type and compression, or
Debian's APT vs verbatim publisher.

## See also

[Serve content](../serve-content.md) · [The content workflow](../../concepts/content-workflow.md)
