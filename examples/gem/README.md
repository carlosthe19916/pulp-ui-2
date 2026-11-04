# RubyGems example

Companion to the [RubyGems repository manager](../../website/docs/tutorials/gem.mdx) tutorial.

| Path         | What it is                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| `hello-lib/` | `hello_pulp`, a gem published to Pulp (depends on `rainbow` from rubygems.org).                          |
| `hello-app/` | An app whose `Gemfile` takes `hello_pulp` from Pulp and everything else from the cache.                  |
| `setup.sh`   | Creates `rubygems-proxy` (pull-through to rubygems.org) and `gems-hosted`.                               |
| `demo.sh`    | Installs a gem through the cache, uploads and publishes `hello_pulp`, then bundles and runs `hello-app`. |

Requires `curl`, `jq` and Ruby 3.0+ with Bundler.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

demo.sh uses throwaway gem and bundle directories (`.gem-demo/`), so every gem really comes
from Pulp.
