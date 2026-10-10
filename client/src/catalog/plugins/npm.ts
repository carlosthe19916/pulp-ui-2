import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

const npmRepositoryExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const npmDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "resource",
    resourceKind: "repository",
  },
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
];

export const npm = definePlugin({
  app: { isAvailable: whenInstalled("npm", "pulp-npm") },
  ui: { label: "npm" },
  rest: { pulpType: "npm.npm", apiPath: "npm/npm" },
  entities: {
    // npm repository: supports sync but has no publications (publish stays off).
    repository: {
      capabilities: { sync: { remoteTypes: ["npm.npm"] } },
      form: {
        createFields: [...repositoryBase.create, ...npmRepositoryExtras],
        editFields: [...repositoryBase.edit, ...npmRepositoryExtras],
      },
      page: {
        detailFields: [
          ...repositoryBase.detail,
          {
            key: "retain_checkpoints",
            label: "Retained Checkpoints",
            type: "number",
          },
        ],
      },
    },

    // npm remote: no fields beyond the pulpcore remote base.
    remote: {
      isWizard: true,
      form: { createFields: remoteBase.create, editFields: remoteBase.edit },
      page: { detailFields: remoteBase.detail },
    },

    // npm distribution: serves a repository, or pull-through via a remote.
    distribution: {
      form: {
        createFields: [...distributionBase.create, ...npmDistributionExtras],
        editFields: [...distributionBase.edit, ...npmDistributionExtras],
      },
      page: {
        detailFields: [
          ...distributionBase.detail,
          { key: "repository", label: "Repository", type: "text" },
          { key: "remote", label: "Remote", type: "text" },
        ],
        browseCardFields: [
          { key: "base_path", label: "Base path", type: "text" },
          { key: "base_url", label: "Base URL", type: "text" },
        ],
      },
    },
  },
});
