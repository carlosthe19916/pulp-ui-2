---
title: Tutorials
description: End-to-end guides that set up Pulp as the repository manager for one package ecosystem.
sidebar_position: 1
---

# Tutorials

Each tutorial sets up Pulp as the repository manager for one ecosystem, the way you would with Nexus or Artifactory: proxy the public registry, host your own packages, then point the native client at Pulp. Every tutorial has a runnable example in the [`examples/`](https://github.com/carlosthe19916/pulp-ui-2/tree/main/examples) folder of the repository.

| Ecosystem            | Proxy         | Host your own       | Client        |
| -------------------- | ------------- | ------------------- | ------------- |
| [Maven](./maven.mdx) | Maven Central | Releases, snapshots | `mvn`, Gradle |

## Before you start

Every tutorial assumes:

1. **A Pulp server with the plugin installed.** For a local one, run `npm run backend:setup` and `npm run backend:start` from the repository root. It listens on `http://localhost:5003` with the user `admin` / `password`, domains enabled and `API_ROOT` set to `/api/pulp/`.
2. **Pulp UI connected to it.** Run `npm run start:dev` and open `http://localhost:3000`. See [Installation](../getting-started/installation.md).
3. **A domain.** With domains enabled, pick one in the domain selector (the examples use `default`). Content URLs then include the domain, for example `/pulp/content/default/<base-path>/`. See [Domains](../user-guide/domains.md).

## Run the examples

Each `examples/<ecosystem>/` folder has the same files:

| File           | Purpose                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| `.env.example` | Pulp URL, domain and credentials. Copy it to `.env`.                          |
| `setup.sh`     | Creates the same Pulp objects as the tutorial, through the REST API.          |
| `demo.sh`      | Runs the client side of the tutorial: consume, publish, consume your package. |

```bash
cd examples/maven
cp .env.example .env
./setup.sh   # or follow the tutorial in Pulp UI
./demo.sh
```
