import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition } from "../types";

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

export const ansible: IPluginDefinition = {
  app: { isAvailable: whenInstalled("ansible", "pulp-ansible") },
  rest: { pulpType: "ansible.ansible", apiPath: "ansible/ansible" },
  entities: {
    // Ansible repository: a remote to sync from plus GPG verification.
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

    // Ansible distribution: serves a repository or a specific repository version.
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
