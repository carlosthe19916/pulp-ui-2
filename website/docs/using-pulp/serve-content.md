---
title: Serve content
sidebar_position: 5
---

# Serve content

**Goal:** expose a repository at a stable URL your tools can pull from. Creating a repository
doesn't publish it — a **Distribution** does. This is the step Artifactory does for you implicitly;
in Pulp it's explicit (and gives you more control).

## Steps

1. **Publish (only some ecosystems).** RPM, Debian and Gem need a **Publication** — the generated
   index (`repomd.xml`, `Release`, …) — created from a repository version. Open the repository and
   choose **Publish**, or create one under **Content Management → Publications**. Python, Ansible,
   Container, OSTree, npm, Maven and Hugging Face skip this and serve straight from the version. See
   [the content workflow](../concepts/content-workflow.md).
2. **Create a Distribution** — **Content Management → Distributions → Create**:
   - **Base path** — the URL segment clients hit.
   - **Serve** — point it at a **Repository** (always the latest version), a **specific version**,
     or a **Publication**.
3. Content is now live at `/pulp/content/<domain>/<base_path>/`. Point a client at it —
   [Consume content](./consume-content.md).

## Keep what clients see stable

Pointing a Distribution at a **Repository** always serves its latest version — convenient, but new
syncs change what clients get. To freeze it, point the Distribution at a **specific repository
version** or a **Publication**. See [Versions and rollback](./versions-and-rollback.md).

## Protect it

`/pulp/content/` is **anonymous by default** — anyone with the URL can pull. To require
authentication or restrict access, attach a **content guard** to the Distribution. See
[Content guards](../administration/content-guards.md).

## Reference

[Publications](./reference/publications.md) · [Distributions](./reference/distributions.md).
