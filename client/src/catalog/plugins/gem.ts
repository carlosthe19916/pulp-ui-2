import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

const gemRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const gemRemoteExtras: IEntityField[] = [
  {
    key: "prereleases",
    label: "Prereleases",
    type: "boolean",
    group: "Advanced",
  },
  { key: "includes", label: "Includes", type: "textarea", group: "Advanced" },
  { key: "excludes", label: "Excludes", type: "textarea", group: "Advanced" },
];

const gemDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "asyncResource",
    resourceKind: "publication",
  },
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
];

export const gem: IPluginDefinition = {
  app: { isAvailable: whenInstalled("gem", "pulp-gem") },
  rest: { pulpType: "gem.gem", apiPath: "gem/gem" },
  entities: {
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...gemRepositoryExtras],
        editFields: [...repositoryBase.edit, ...gemRepositoryExtras],
      },
      compatibleRemoteTypes: ["gem.gem"],
      compatiblePublicationTypes: ["gem.gem"],
      contentChanges: "modify",
      archiveImport: false,
    },

    remote: {
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...gemRemoteExtras],
        editFields: [...remoteBase.edit, ...gemRemoteExtras],
      },
    },

    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...gemDistributionExtras],
        editFields: [...distributionBase.edit, ...gemDistributionExtras],
      },
    },

    publication: {
      form: {
        isWizard: false,
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
        editFields: [],
      },
    },
  },

  content: [
    {
      pulpType: "gem.gem",
      apiPath: "gem/gem",
      uploadable: { mechanism: "create", fields: [] },
    },
  ],
};
