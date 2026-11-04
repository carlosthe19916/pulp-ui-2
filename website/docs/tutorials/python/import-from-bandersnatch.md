---
title: Import a remote from a Bandersnatch config
sidebar_label: Import from Bandersnatch
sidebar_position: 4
---

# Import a remote from a Bandersnatch config

**Goal:** migrate an existing [Bandersnatch](https://pypi.org/project/bandersnatch/) PyPI mirror
into Pulp without re-entering its filters by hand. Pulp reads your `bandersnatch.conf` and builds a
matching Python remote.

Useful when a team already runs a Bandersnatch mirror and wants Pulp to take over the same curated
set.

## Steps

1. Go to **Content Management → Remotes** and open the **Create** menu.
2. Choose **From Bandersnatch config**.
3. Fill in:

   | Field  | Meaning                                                            |
   | ------ | ------------------------------------------------------------------ |
   | Name   | The new remote's name.                                             |
   | File   | Your existing `bandersnatch.conf`.                                 |
   | Policy | The [download policy](../../concepts/download-policies.md) to use. |

4. Create it. Pulp translates the config's whitelist/blacklist and options into the remote's filters.
5. Attach the remote to a repository and **Sync**, as in the [Python tutorial](../python.mdx).

Review the generated filters afterward — see [Curate a PyPI mirror](./curate-mirror-with-filters.md)
— and adjust anything Bandersnatch expressed differently.

## Related

- [Curate a PyPI mirror with filters](./curate-mirror-with-filters.md)
- [Remotes reference](../../using-pulp/reference/remotes.md)
- Plugin reference: [pulp_python](https://pulpproject.org/pulp_python/)
