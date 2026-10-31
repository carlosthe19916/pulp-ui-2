import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const collectionVersions = ({
  key,
  label = "Collection versions",
}: {
  key: string;
  label?: string;
}): IEntityField => ({
  key,
  label,
  type: "content",
  pulpTypes: ["ansible.collection_version"],
  required: true,
});

const copyMoveFields: IEntityField[] = [
  collectionVersions({ key: "collection_versions" }),
  {
    key: "destination_repositories",
    label: "Destination repositories",
    type: "asyncResource",
    resourceKind: "repository",
    multiple: true,
    required: true,
  },
  {
    key: "signing_service",
    label: "Signing service",
    type: "asyncResource",
    resourceKind: "signingService",
    helpText: "Signs the collection versions before adding them.",
  },
];

const markFields: IEntityField[] = [
  { key: "value", label: "Mark", type: "text", required: true },
  collectionVersions({ key: "content_units" }),
];

const ansibleActions: IRepositoryAction[] = [
  {
    key: "sign",
    label: "Sign collections",
    path: "sign/",
    target: "repository",
    fields: [
      {
        key: "signing_service",
        label: "Signing service",
        type: "asyncResource",
        resourceKind: "signingService",
        required: true,
      },
      collectionVersions({ key: "content_units" }),
    ],
  },
  {
    key: "mark",
    label: "Mark collections",
    path: "mark/",
    target: "repository",
    fields: markFields,
  },
  {
    key: "unmark",
    label: "Unmark collections",
    path: "unmark/",
    target: "repository",
    fields: markFields,
  },
  {
    key: "copy-collection-version",
    label: "Copy collection versions",
    path: "copy_collection_version/",
    target: "repository",
    fields: copyMoveFields,
  },
  {
    key: "move-collection-version",
    label: "Move collection versions",
    path: "move_collection_version/",
    target: "repository",
    fields: copyMoveFields,
  },
  {
    key: "rebuild-metadata",
    label: "Rebuild metadata",
    path: "rebuild_metadata/",
    target: "repository",
    description:
      "Rebuilds collection metadata; narrow it to a namespace, name or version.",
    fields: [
      { key: "namespace", label: "Namespace", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "version", label: "Version", type: "text" },
    ],
  },
  {
    key: "copy",
    label: "Advanced copy",
    path: "/ansible/copy/",
    target: "repository",
    description:
      "Copies content between repositories as described by a config.",
    fields: [
      {
        key: "config",
        label: "Config",
        type: "json",
        required: true,
        helpText:
          'A list of {"source_repo_version", "dest_repo", "content"} entries.',
      },
    ],
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
        fields: [
          {
            key: "expected_namespace",
            label: "Expected namespace",
            type: "text",
          },
          { key: "expected_name", label: "Expected name", type: "text" },
          { key: "expected_version", label: "Expected version", type: "text" },
        ],
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
        fields: [
          {
            key: "signed_collection",
            label: "Signed collection href",
            type: "text",
            required: true,
            helpText:
              "The pulp_href of the collection version this signature signs.",
          },
        ],
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
