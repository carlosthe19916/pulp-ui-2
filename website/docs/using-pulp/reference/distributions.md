---
title: Distributions
sidebar_position: 5
---

# Distributions

A distribution is the **URL clients pull from** — the public face of a repository. Nothing you create
is reachable until a distribution exposes it, so this is the step that "turns on" a repo. Its
`base_path` becomes the address:

```
/pulp/content/<domain>/<base_path>/
```

Manage distributions under **Content Management → Distributions**: create, edit, delete, and open one
for its detail page (with an **Access** tab for per-object roles).

## What it points at

| Serve              | Result                                                      |
| ------------------ | ----------------------------------------------------------- |
| A repository       | Always serves its **latest** version (updates as you sync). |
| A specific version | Freezes what clients see.                                   |
| A publication      | For rpm/deb/gem, the generated metadata.                    |

## Protecting it

By default `/pulp/content/` is anonymous. Attach a
[content guard](../../administration/content-guards.md) to require authentication or a certificate.

## See also

[Serve content](../serve-content.md) · [Consume content](../consume-content.md) ·
[Content guards](../../administration/content-guards.md)
