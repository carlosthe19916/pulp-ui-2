# Ansible example

Companion to the [Ansible Galaxy server](../../website/docs/tutorials/ansible.mdx) tutorial.

| Path                | What it is                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `ansible.cfg`       | Galaxy servers: the hosted server first, then the mirror.                                          |
| `hello-collection/` | `example.hello`, a collection published to Pulp (depends on `ansible.posix`).                      |
| `playbook/`         | A playbook that uses `example.hello`, and its `requirements.yml`.                                  |
| `setup.sh`          | Creates `ansible-upstream` (a mirror of `ansible.posix` from Galaxy, synced) and `ansible-hosted`. |
| `demo.sh`           | Builds and publishes `example.hello`, installs the requirements from Pulp, runs the playbook.      |

Requires `curl`, `jq` and ansible-core 2.15+.

```bash
cp .env.example .env   # adjust for your Pulp server
./setup.sh
./demo.sh              # VERSION=1.2.0 ./demo.sh publishes another version
```

demo.sh installs collections into a throwaway path (`.ansible-demo/`). Set `REQUIREMENTS`
before `./setup.sh` to mirror other collections.
