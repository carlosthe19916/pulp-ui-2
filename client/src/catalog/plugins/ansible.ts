import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const ansibleActions: IRepositoryAction[] = [
  {
    key: "sign",
    label: "Sign collections",
    path: "sign/",
    target: "repository",
  },
  {
    key: "mark",
    label: "Mark collections",
    path: "mark/",
    target: "repository",
  },
  {
    key: "unmark",
    label: "Unmark collections",
    path: "unmark/",
    target: "repository",
  },
  {
    key: "copy-collection-version",
    label: "Copy collection versions",
    path: "copy_collection_version/",
    target: "repository",
  },
  {
    key: "move-collection-version",
    label: "Move collection versions",
    path: "move_collection_version/",
    target: "repository",
  },
  {
    key: "rebuild-metadata",
    label: "Rebuild metadata",
    path: "rebuild_metadata/",
    target: "repository",
    description:
      "Rebuilds collection metadata; narrow it to a namespace, name or version.",
  },
  {
    key: "copy",
    label: "Advanced copy",
    path: "/ansible/copy/",
    target: "repository",
    description:
      "Copies content between repositories as described by a config.",
  },
];

export const ansible: IPluginDefinition = {
  app: { isAvailable: whenInstalled("ansible", "pulp-ansible") },
  rest: { pulpType: "ansible.ansible", apiPath: "ansible/ansible" },
  entities: {
    repository: {
      compatibleRemoteTypes: [
        "ansible.collection",
        "ansible.role",
        "ansible.git",
      ],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
      actions: ansibleActions,
    },

    // Three remote types: Collection (primary), Role, and Git.
    remote: [
      {
        rest: { pulpType: "ansible.collection", apiPath: "ansible/collection" },
      },
      {
        rest: { pulpType: "ansible.role", apiPath: "ansible/role" },
      },
      {
        rest: { pulpType: "ansible.git", apiPath: "ansible/git" },
      },
    ],

    distribution: {},
  },

  content: [
    {
      pulpType: "ansible.collection_version",
      apiPath: "ansible/collection_versions",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "ansible.collection_deprecation",
      apiPath: "ansible/collection_deprecations",
    },
    {
      pulpType: "ansible.collection_mark",
      apiPath: "ansible/collection_marks",
    },
    {
      pulpType: "ansible.collection_signature",
      apiPath: "ansible/collection_signatures",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "ansible.namespace",
      apiPath: "ansible/namespaces",
    },
    {
      pulpType: "ansible.role",
      apiPath: "ansible/roles",
    },
  ],
};
