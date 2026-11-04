# Python example

Companion to the [Python repository manager](../../website/docs/tutorials/python.mdx) tutorial.

| Path         | What it is                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `pip.conf`   | pip settings: the cache as the index, the hosted index as an extra index.                         |
| `.pypirc`    | twine settings for uploading to the hosted index.                                                 |
| `hello-lib/` | `example-hello-lib`, a library published to Pulp (depends on `rich` from PyPI).                   |
| `hello-app/` | An app that installs `example-hello-lib` from Pulp.                                               |
| `setup.sh`   | Creates `pypi-proxy` (pull-through to pypi.org) and `pypi-hosted`.                                |
| `demo.sh`    | Installs build tools through the cache, uploads `example-hello-lib` with twine, runs `hello-app`. |

Requires `curl`, `jq` and Python 3.9+.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

demo.sh uses a throwaway virtual environment (`.venv-demo/`) with pip's cache off, so every
package really comes from Pulp.
