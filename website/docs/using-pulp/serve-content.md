---
title: Serve content
sidebar_position: 5
---

# Serve content

A repository isn't reachable by clients until a **Distribution** exposes it at a URL.

## Steps

1. **(If your ecosystem needs it) Publish** — create a **Publication** from a repository version.
   RPM, Debian and Gem need this; others serve straight from the version. See
   [the content workflow](../concepts/content-workflow.md).
2. **Create a Distribution** — **Content Management → Distributions → Create**. Give it a
   `base_path` and point it at a Repository (serves its latest version automatically), a specific
   version, or a Publication.
3. The content is now at `/pulp/content/<domain>/<base_path>/`. Point a client at it —
   [Consume content](./consume-content.md).

## Keeping what clients see stable

Pointing a Distribution at a Repository always serves the latest version. To freeze it, point the
Distribution at a **specific repository version** or a Publication.

## Protecting it

By default `/pulp/content/` is anonymous. Attach a **content guard** to require auth — see
[Content guards](../administration/content-guards.md).

:::note
Outline page — full walkthrough and screenshots to follow. Reference:
[Publications](./reference/publications.md), [Distributions](./reference/distributions.md).
:::
