---
title: Tutorials
description: The job each Pulp content plugin is for, and the client and server settings that differ from a local install.
sidebar_label: Overview
sidebar_position: 1
---

# Tutorials

Each page is the job that plugin is for. The runnable companion is [`examples/`](https://github.com/carlosthe19916/pulp-ui-2/tree/main/examples): `setup.sh` creates the Pulp objects through the API, and `demo.sh` runs the client.

| Job                                                                           | Page                               |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| Cache Maven Central; publish releases and snapshots                           | [Maven](./maven.mdx)               |
| Cache npmjs; publish a scope                                                  | [npm](./npm.mdx)                   |
| One PyPI index for private packages and the public index, or a curated mirror | [Python](./python.mdx)             |
| Cache Docker Hub on pull, pin a set of tags, or push images                   | [Container](./container.mdx)       |
| Mirror an RPM distro and promote a curated set                                | [RPM](./rpm.mdx)                   |
| Mirror a Debian or Ubuntu slice, or publish your own `.deb` packages          | [APT](./deb.mdx)                   |
| Cache rubygems.org and publish gems                                           | [RubyGems](./gem.mdx)              |
| A private Galaxy, including Automation Hub                                    | [Ansible](./ansible.mdx)           |
| Raw files, and a manifest another Pulp can sync                               | [Files](./file.mdx)                |
| Cache the Hugging Face Hub                                                    | [Hugging Face](./hugging_face.mdx) |
| An OSTree source of truth for image mode                                      | [OSTree](./ostree.mdx)             |

## Before you start

1. A Pulp server with the plugin installed. From this repository, `npm run backend:setup` and `npm run backend:start` listen on `http://localhost:5003` as `admin` / `password`, with domains enabled and `API_ROOT` `/api/pulp/`.
2. Pulp UI pointed at it: the container (see [Container](../running-pulp-ui/container.md), which has the exact command for this backend), or `npm run start:dev` on `http://localhost:3000`.
3. A [domain](../concepts/operating.md#domains). The examples use `default`, so content URLs look like `/pulp/content/default/<base-path>/`.

The URLs in each page are for that local backend. Use the base URL your distribution shows.

### Settings the local backend already has

On your own server, set these to the URL clients use:

| Setting                | Local value             | Needed by                                                                           |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `PYPI_API_HOSTNAME`    | `http://localhost:5003` | [Python](./python.mdx): the index URL                                               |
| `ANSIBLE_API_HOSTNAME` | `http://localhost:5003` | [Ansible](./ansible.mdx): the Galaxy client URL                                     |
| `TOKEN_AUTH_DISABLED`  | `True`                  | [Container](./container.mdx): basic auth. Production usually runs the token server. |

## Run an example

Each `examples/<ecosystem>/` folder needs `curl` and `jq`, plus the client that page names.

```bash
cd examples/maven
cp .env.example .env
./setup.sh
./demo.sh
```
