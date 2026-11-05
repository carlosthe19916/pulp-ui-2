---
slug: /intro
title: Introduction
description: Pulp UI is a web console for Pulp. Start from the job you have, not from a tour of the screens.
sidebar_position: 1
---

# Introduction

:::info[Community project]

Pulp UI is an independent project maintained by an individual contributor in [this repository](https://github.com/carlosthe19916/pulp-ui-2). It is not an official Pulp Project product and is not endorsed by the Pulp Project. For Pulp itself, see [pulpproject.org](https://pulpproject.org/).

:::

**Pulp UI** is a web console for [Pulp](https://pulpproject.org/), the open source platform for managing repositories of software packages and serving them to clients. Pulp is API-first. The UI is one way to drive that API.

The screens name the objects. These docs cover the decisions the screens do not: which object a job needs, the client file, and what breaks later.

## Start from the job

| You want to                                                                 | Read                                                                                      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Cache Maven Central, npmjs, PyPI or RubyGems, and publish your own packages | [If you know Artifactory](./concepts/index.md), then the [tutorial](./tutorials/index.md) |
| Mirror Fedora, RHEL, Debian or Ubuntu and promote a curated set             | [RPM](./tutorials/rpm.mdx) or [APT](./tutorials/deb.mdx)                                  |
| Cache a container registry, or push images                                  | [Container](./tutorials/container.mdx)                                                    |
| Run a private Galaxy or mirror Automation Hub                               | [Ansible](./tutorials/ansible.mdx)                                                        |
| Serve ISOs and other files, including to another Pulp                       | [Files](./tutorials/file.mdx)                                                             |
| Cache Hugging Face models                                                   | [Hugging Face](./tutorials/hugging_face.mdx)                                              |
| Serve rpm-ostree or image-mode commits                                      | [OSTree](./tutorials/ostree.mdx)                                                          |
| Move content to a server that cannot reach this one                         | [Disconnected and multi-site](./concepts/disconnected.md)                                 |
| Let CI publish without an administrator account                             | [Who can push](./concepts/access-control.md)                                              |
| Run the server: stuck tasks, signing, download guards, tenants              | [Operating Pulp](./concepts/operating.md)                                                 |

Pulp UI shows the plugins installed on your server and only offers types those plugins provide.

## Install

[Install Pulp UI](./running-pulp-ui/container.md) from its container image and point it at your Pulp server.
