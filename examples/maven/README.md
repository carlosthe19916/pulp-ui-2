# Maven example

Companion to the [Maven repository manager](../../website/docs/tutorials/maven.mdx) tutorial.

| Path           | What it is                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| `settings.xml` | Maven settings: Central mirror, hosted repositories, deploy credentials.        |
| `hello-lib/`   | A library published to Pulp (depends on `commons-lang3` from Maven Central).    |
| `hello-app/`   | An app that consumes `hello-lib` from Pulp.                                     |
| `setup.sh`     | Creates `maven-central` (pull-through), `maven-releases`, `maven-snapshots`.    |
| `demo.sh`      | Builds and deploys `hello-lib` (snapshot, then release), then runs `hello-app`. |

Requires `curl`, `jq`, JDK 17+ and Maven 3.9+.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh releases another version
```

`demo.sh` uses a throwaway local repository (`.m2-demo/`), so every artifact really comes from
Pulp and your `~/.m2` is left alone. To use the settings by hand, export the variables from `.env`
and pass `-s settings.xml`:

```bash
set -a && source .env && set +a
mvn -s settings.xml -f hello-lib/pom.xml deploy -Drevision=1.0.0
```
