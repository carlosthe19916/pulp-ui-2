---
title: Tutorials
description: End-to-end guides that set up Pulp as the repository manager for one package ecosystem.
sidebar_position: 1
---

# Tutorials

Each tutorial sets up Pulp as the repository manager for one ecosystem, the way you would with Nexus or Artifactory: proxy the public registry, host your own packages, then point the native client at Pulp. Every tutorial has a runnable example in the [`examples/`](https://github.com/carlosthe19916/pulp-ui-2/tree/main/examples) folder of the repository.

| Ecosystem                          | Proxy (cache or mirror)               | Host your own                      | Client                  |
| ---------------------------------- | ------------------------------------- | ---------------------------------- | ----------------------- |
| [Maven](./maven.mdx)               | Maven Central, pull-through           | Releases, snapshots (`mvn deploy`) | `mvn`, Gradle           |
| [npm](./npm.mdx)                   | registry.npmjs.org, pull-through      | Scoped packages (`npm publish`)    | `npm`                   |
| [Python](./python.mdx)             | PyPI, pull-through                    | Packages (`twine upload`)          | `pip`, `twine`          |
| [Container](./container.mdx)       | Docker Hub, pull-through              | Images (`podman push`)             | `podman`, `docker`      |
| [RPM](./rpm.mdx)                   | Any RPM repository, on-demand mirror  | Packages (upload)                  | `dnf`                   |
| [APT (Debian)](./deb.mdx)          | Any APT repository, on-demand mirror  | Packages (upload)                  | `apt`                   |
| [RubyGems](./gem.mdx)              | rubygems.org, pull-through            | Gems (upload and publish)          | `gem`, Bundler          |
| [Ansible](./ansible.mdx)           | Galaxy, mirror of listed collections  | Collections (`ansible-galaxy`)     | `ansible-galaxy`        |
| [Files (raw)](./file.mdx)          | A `PULP_MANIFEST`, on-demand mirror   | Any file (upload)                  | `curl`                  |
| [Hugging Face](./hugging_face.mdx) | Hugging Face Hub, pull-through        | Not available                      | `hf`, `huggingface_hub` |
| [OSTree](./ostree.mdx)             | Any OSTree repository, mirror of refs | Commits (archive import)           | `ostree`                |

Ecosystems differ in what Pulp supports. A **pull-through** cache fetches a package from upstream the first time a client asks for it. Where Pulp has none, you **sync** a remote instead, usually with the **On demand** policy, which downloads the metadata now and each package on first request. Where the native client can't publish to Pulp (`upload`), you upload in Pulp UI or through the REST API.

## Before you start

Every tutorial assumes:

1. **A Pulp server with the plugin installed.** For a local one, run `npm run backend:setup` and `npm run backend:start` from the repository root. It listens on `http://localhost:5003` with the user `admin` / `password`, domains enabled and `API_ROOT` set to `/api/pulp/`.
2. **Pulp UI connected to it.** Run `npm run start:dev` and open `http://localhost:3000`. See [Installation](../getting-started/installation.md).
3. **A domain.** With domains enabled, pick one in the domain selector (the examples use `default`). Content URLs then include the domain, for example `/pulp/content/default/<base-path>/`. See [Domains](../user-guide/domains.md).

### Non-local servers

The local backend sets three settings so client URLs and the container registry work out of the box. On your own Pulp server, set them to the URL clients use:

| Setting                | Local value             | Needed by                                                                                                   |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `PYPI_API_HOSTNAME`    | `http://localhost:5003` | [Python](./python.mdx): the PyPI distribution's base URL                                                    |
| `ANSIBLE_API_HOSTNAME` | `http://localhost:5003` | [Ansible](./ansible.mdx): the Galaxy client URL                                                             |
| `TOKEN_AUTH_DISABLED`  | `True`                  | [Container](./container.mdx): basic auth for the registry; production usually runs the token server instead |

## Run the examples

Each `examples/<ecosystem>/` folder has the same files, and needs `curl` and `jq` plus the ecosystem's own client (each tutorial lists it):

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
