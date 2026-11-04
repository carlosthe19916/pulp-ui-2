# Container example

Companion to the [Container registry](../../website/docs/tutorials/container.mdx) tutorial.

| Path         | What it is                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| `hello-app/` | A `Containerfile` built on busybox from the Pulp cache of Docker Hub.                   |
| `setup.sh`   | Creates the `docker-hub` pull-through remote and distribution.                          |
| `demo.sh`    | Pulls busybox through the cache, builds and pushes `hello-app`, then runs it from Pulp. |

Requires `curl`, `jq` and podman 4+.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

The local backend serves plain http, so demo.sh passes `--tls-verify=false`; set
`TLS_VERIFY=true` for a server with TLS.
