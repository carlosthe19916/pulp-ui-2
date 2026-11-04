# Generic files example

Companion to the [Generic file repository](../../website/docs/tutorials/file.mdx) tutorial.

| Path       | What it is                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `hello/`   | A script packaged as `hello-<version>.tar.gz` and published to Pulp.                                                 |
| `setup.sh` | Creates `files-upstream` (an on-demand mirror of a `PULP_MANIFEST`, synced) and `files-hosted`, both auto-published. |
| `demo.sh`  | Downloads a mirrored file, uploads the tarball, then downloads it and checks it against the `PULP_MANIFEST`.         |

Requires `curl`, `jq` and tar and sha256sum.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```
