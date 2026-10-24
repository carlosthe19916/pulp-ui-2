import { distributionBase, remoteBase, repositoryBase } from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

const npmRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const npmDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
];

export const npm: IPluginDefinition = {
  app: { isAvailable: whenInstalled("npm", "pulp-npm") },
  rest: { pulpType: "npm.npm", apiPath: "npm/npm" },
  entities: {
    // npm repository: supports sync but has no publications (publish stays off).
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...npmRepositoryExtras],
        editFields: [...repositoryBase.edit, ...npmRepositoryExtras],
      },
      compatibleRemoteTypes: ["npm.npm"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
    },

    remote: {
      form: {
        isWizard: true,
        createFields: remoteBase.create,
        editFields: remoteBase.edit,
      },
    },

    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...npmDistributionExtras],
        editFields: [...distributionBase.edit, ...npmDistributionExtras],
      },
    },
  },

  content: [
    {
      pulpType: "npm.package",
      apiPath: "npm/packages",
      uploadable: {
        mechanism: "upload",
        fields: [
          { key: "relative_path", label: "Relative path", type: "text" },
          { key: "name", label: "Name", type: "text" },
          { key: "version", label: "Version", type: "text" },
        ],
      },
    },
  ],
};
