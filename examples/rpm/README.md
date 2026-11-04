# RPM example

Companion to the [RPM repository manager](../../website/docs/tutorials/rpm.mdx) tutorial.

| Path               | What it is                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `hello/hello.spec` | The spec of `hello-pulp`, a package published to Pulp.                                          |
| `setup.sh`         | Creates `rpm-upstream` (an on-demand mirror, synced) and `rpm-hosted`, both auto-published.     |
| `demo.sh`          | Builds `hello-pulp`, uploads it to `rpm-hosted`, then installs from both repositories with dnf. |

Requires `curl`, `jq` and podman (the build and dnf run in a Fedora container).

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

Set `UPSTREAM_URL` before `./setup.sh` to mirror another repository.
