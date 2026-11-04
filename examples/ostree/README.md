# OSTree example

Companion to the [OSTree repository manager](../../website/docs/tutorials/ostree.mdx) tutorial.

| Path       | What it is                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `hello/`   | A tree committed as the `hello/stable` ref and imported into Pulp.                                   |
| `setup.sh` | Creates `ostree-upstream` (a mirror of the fixtures' `stable` ref, synced) and `ostree-hosted`.      |
| `demo.sh`  | Commits `hello/`, imports the archive into `ostree-hosted`, then pulls refs from both distributions. |

Requires `curl`, `jq` and podman (ostree runs in a Fedora container).

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```
