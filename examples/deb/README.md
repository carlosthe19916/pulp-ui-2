# APT example

Companion to the [APT repository manager](../../website/docs/tutorials/deb.mdx) tutorial.

| Path       | What it is                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `hello/`   | The tree of `hello-pulp`, a package published to Pulp.                                                                   |
| `setup.sh` | Creates `apt-upstream` (an on-demand mirror of nginx's Debian repository, synced) and `apt-hosted`, both auto-published. |
| `demo.sh`  | Builds `hello-pulp`, uploads it to `apt-hosted`, then installs from both repositories with apt.                          |

Requires `curl`, `jq` and podman (the build and apt run in a Debian container).

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

Set `UPSTREAM_URL`, `UPSTREAM_DIST`, `UPSTREAM_COMPONENT` and `UPSTREAM_ARCH` before `./setup.sh` to
mirror another repository.
