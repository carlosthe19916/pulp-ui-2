---
slug: /intro
title: Introduction
sidebar_position: 1
---

# Introduction

:::info[Community project]

Pulp UI is an independent project maintained by an individual contributor in [this repository](https://github.com/carlosthe19916/pulp-ui-2). It is not an official Pulp Project product and is not endorsed by the Pulp Project. For Pulp itself, see [pulpproject.org](https://pulpproject.org/).

:::

**Pulp UI** is a web console for [Pulp](https://pulpproject.org/), the open source platform for managing repositories of software packages and making them available to a large number of consumers.

Pulp is API-first: everything it does is exposed through a REST API. Pulp UI puts a [PatternFly](https://www.patternfly.org/)-based interface on top of that API so you can manage your content from the browser.

## Who is it for?

- **Platform and release engineers** who mirror upstream content (RHEL, Fedora, PyPI, Docker Hub, Galaxy, …) and promote it through environments.
- **Developers** who need to find out what is in a repository, which version is published, or why a sync failed.
- **Administrators** who manage users, groups, roles and domains on a shared Pulp installation.

## What you can do

| Area                  | What it covers                                                        |
| --------------------- | --------------------------------------------------------------------- |
| **Remotes**           | Define upstream sources and how content is fetched from them.         |
| **Repositories**      | Create repositories, sync them from remotes, inspect versions.        |
| **Publications**      | Generate the metadata clients need from a repository version.         |
| **Distributions**     | Serve a publication or repository version at a stable URL.            |
| **Content**           | Browse and inspect packages, images, collections and other artifacts. |
| **Tasks**             | Follow long-running operations such as syncs and deletions.           |
| **Domains**           | Switch between isolated Pulp domains (multi-tenancy).                 |
| **Access management** | Manage users, groups and roles.                                       |

## Supported content types

Pulp UI works with the content plugins installed on your Pulp server, including RPM, Container, Python, Ansible, Debian, Maven, npm, Ruby Gems, OSTree, Hugging Face and File. Pulp UI detects which plugins are installed and only offers to create resources for those.

## Next steps

- [Install Pulp UI](./getting-started/installation.md)
- [Take your first steps](./getting-started/first-steps.md)
