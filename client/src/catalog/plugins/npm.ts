import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
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
  ui: { label: "npm" },
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
    },

    // npm remote: no fields beyond the pulpcore remote base.
    remote: {
      form: {
        isWizard: true,
        createFields: remoteBase.create,
        editFields: remoteBase.edit,
      },
    },

    // npm distribution: serves a repository, or pull-through via a remote.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...npmDistributionExtras],
        editFields: [...distributionBase.edit, ...npmDistributionExtras],
      },
    },
  },
};
