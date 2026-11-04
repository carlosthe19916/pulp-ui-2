---
title: Consume content
sidebar_position: 6
---

# Consume content

Point your native client at a Pulp distribution's URL. The config differs per ecosystem — each
tutorial has the exact, copy-pasteable steps.

| Ecosystem                                     | Client             | How you point it at Pulp                            |
| --------------------------------------------- | ------------------ | --------------------------------------------------- |
| [Python](../tutorials/python.mdx)             | `pip`, `twine`     | `index-url` → `.../pypi/<base_path>/simple/`        |
| [RPM](../tutorials/rpm.mdx)                   | `dnf`              | a `.repo` file in `/etc/yum.repos.d/`               |
| [Container](../tutorials/container.mdx)       | `podman`, `docker` | `podman pull <pulp>/<base_path>:<tag>`              |
| [Debian](../tutorials/deb.mdx)                | `apt`              | a `deb` line in `sources.list`                      |
| [Ansible](../tutorials/ansible.mdx)           | `ansible-galaxy`   | `-s <client_url>` or `server_list` in `ansible.cfg` |
| [npm](../tutorials/npm.mdx)                   | `npm`, `yarn`      | `--registry <pulp>/<base_path>`                     |
| [Maven](../tutorials/maven.mdx)               | `mvn`, Gradle      | a `<mirror>` in `settings.xml`                      |
| [RubyGems](../tutorials/gem.mdx)              | `gem`, Bundler     | `--source <base_url>`                               |
| [OSTree](../tutorials/ostree.mdx)             | `ostree`           | `ostree remote add`                                 |
| [Hugging Face](../tutorials/hugging_face.mdx) | `hf`               | `HF_ENDPOINT=<base_url>`                            |
| [Files](../tutorials/file.mdx)                | `curl`             | direct `GET` of the file URL                        |

See the matching [tutorial](../tutorials/index.md) for the full client configuration.
