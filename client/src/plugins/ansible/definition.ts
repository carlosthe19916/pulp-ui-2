import { definePlugin } from "@plugin-sdk/definition";

/** Ansible: collections and roles, synced from Galaxy or Git and served as a Galaxy API. */
export const ansible = definePlugin({
  id: "ansible",
  packages: ["ansible", "pulp-ansible"],
  remote: {
    "ansible.collection": { apiPath: "ansible/collection" },
    "ansible.role": { apiPath: "ansible/role" },
    "ansible.git": { apiPath: "ansible/git" },
  },
  repository: {
    "ansible.ansible": {
      apiPath: "ansible/ansible",
      compatibleRemoteTypes: [
        "ansible.collection",
        "ansible.role",
        "ansible.git",
      ],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      actions: {
        sign: { path: "sign/", target: "repository" },
        mark: { path: "mark/", target: "repository" },
        unmark: { path: "unmark/", target: "repository" },
        "copy-collection-version": {
          path: "copy_collection_version/",
          target: "repository",
        },
        "move-collection-version": {
          path: "move_collection_version/",
          target: "repository",
        },
        "rebuild-metadata": { path: "rebuild_metadata/", target: "repository" },
        copy: { path: "/ansible/copy/", target: "repository" },
      },
    },
  },
  distribution: { "ansible.ansible": { apiPath: "ansible/ansible" } },
  content: {
    "ansible.collection_version": {
      apiPath: "ansible/collection_versions",
      upload: "create",
    },
    "ansible.collection_deprecation": {
      apiPath: "ansible/collection_deprecations",
    },
    "ansible.collection_mark": { apiPath: "ansible/collection_marks" },
    "ansible.collection_signature": {
      apiPath: "ansible/collection_signatures",
      upload: "create",
    },
    "ansible.namespace": { apiPath: "ansible/namespaces" },
    "ansible.role": { apiPath: "ansible/roles" },
  },
});
