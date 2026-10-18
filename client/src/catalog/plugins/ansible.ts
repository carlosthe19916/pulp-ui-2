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
  ui: { label: "Ansible" },
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
    },

    // Three remote types: Collection (primary), Role, and Git.
    remote: [
      {
        ui: { label: "Collection" },
        rest: { pulpType: "ansible.collection", apiPath: "ansible/collection" },
        form: {
          isWizard: true,
          createFields: [...remoteBase.create, ...collectionRemoteExtras],
          editFields: [...remoteBase.edit, ...collectionRemoteExtras],
        },
      },
      {
        ui: { label: "Role" },
        rest: { pulpType: "ansible.role", apiPath: "ansible/role" },
        form: {
          isWizard: true,
          createFields: remoteBase.create,
          editFields: remoteBase.edit,
        },
      },
      {
        ui: { label: "Git" },
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
};
