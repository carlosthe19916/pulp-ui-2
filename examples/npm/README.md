# npm example

Companion to the [npm repository manager](../../website/docs/tutorials/npm.mdx) tutorial.

| Path         | What it is                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `.npmrc`     | npm settings: cache as the default registry, `@example` scope from the hosted registry, publish credentials. |
| `hello-lib/` | `@example/hello-lib`, a library published to Pulp.                                                           |
| `hello-app/` | An app that installs `@example/hello-lib` from Pulp and `picocolors` through the cache.                      |
| `setup.sh`   | Creates `npm-proxy` (pull-through to registry.npmjs.org) and `npm-hosted`.                                   |
| `demo.sh`    | Publishes `@example/hello-lib`, then installs and runs `hello-app`.                                          |

Requires `curl`, `jq` and Node.js 20+ with npm.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

demo.sh works on a throwaway copy (`.npm-demo/`) with its own npm cache, so every package
really comes from Pulp and your `~/.npmrc` is left alone. `.npmrc` reads its values from
environment variables that `demo.sh` sets.
