import { distributionBase, remoteBase, repositoryBase } from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition, IRepositoryAction } from "../types";

/** GitRemote has no `policy` field (always on-demand server-side), so drop it. */
const withoutPolicy = (fields: IEntityField[]): IEntityField[] =>
  fields.filter((field) => field.key !== "policy");

const ansibleRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "gpgkey", label: "GPG Key", type: "textarea" },
];

const collectionRemoteExtras: IEntityField[] = [
  { key: "requirements_file", label: "Requirements File", type: "textarea" },
  { key: "auth_url", label: "Auth URL", type: "text", group: "Authentication" },
  { key: "token", label: "Token", type: "text", group: "Authentication" },
  { key: "sync_dependencies", label: "Sync Dependencies", type: "boolean" },
  { key: "signed_only", label: "Signed Only", type: "boolean" },
  {
    key: "sync_highest_versions",
    label: "Sync Highest Versions",
    type: "number",
  },
];

const gitRemoteExtras: IEntityField[] = [
  { key: "metadata_only", label: "Metadata Only", type: "boolean" },
  { key: "git_ref", label: "Git Ref", type: "text", group: "General" },
];

const ansibleDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
];

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
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...ansibleRepositoryExtras],
        editFields: [...repositoryBase.edit, ...ansibleRepositoryExtras],
      },
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
        form: {
          isWizard: true,
          createFields: [...remoteBase.create, ...collectionRemoteExtras],
          editFields: [...remoteBase.edit, ...collectionRemoteExtras],
        },
      },
      {
        rest: { pulpType: "ansible.role", apiPath: "ansible/role" },
        form: {
          isWizard: true,
          createFields: remoteBase.create,
          editFields: remoteBase.edit,
        },
      },
      {
        rest: { pulpType: "ansible.git", apiPath: "ansible/git" },
        form: {
          isWizard: true,
          createFields: [
            ...withoutPolicy(remoteBase.create),
            ...gitRemoteExtras,
          ],
          editFields: [...withoutPolicy(remoteBase.edit), ...gitRemoteExtras],
        },
      },
    ],

    distribution: {
      form: {
        isWizard: false,
        createFields: [
          ...distributionBase.create,
          ...ansibleDistributionExtras,
        ],
        editFields: [...distributionBase.edit, ...ansibleDistributionExtras],
      },
    },
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
