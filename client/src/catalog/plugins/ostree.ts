import { distributionBase, remoteBase, repositoryBase } from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

const ostreeRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  {
    key: "compute_delta",
    label: "Compute Delta",
    type: "boolean",
    defaultValue: true,
  },
];

const ostreeRemoteExtras: IEntityField[] = [
  { key: "depth", label: "Depth", type: "number", group: "General" },
  { key: "include_refs", label: "Include Refs", type: "textarea" },
  { key: "exclude_refs", label: "Exclude Refs", type: "textarea" },
];

const ostreeDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
];

export const ostree: IPluginDefinition = {
  app: { isAvailable: whenInstalled("ostree", "pulp-ostree") },
  rest: { pulpType: "ostree.ostree", apiPath: "ostree/ostree" },
  entities: {
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...ostreeRepositoryExtras],
        editFields: [...repositoryBase.edit, ...ostreeRepositoryExtras],
      },
      compatibleRemoteTypes: ["ostree.ostree"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: true,
    },

    remote: {
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...ostreeRemoteExtras],
        editFields: [...remoteBase.edit, ...ostreeRemoteExtras],
      },
    },

    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...ostreeDistributionExtras],
        editFields: [...distributionBase.edit, ...ostreeDistributionExtras],
      },
    },
  },

  content: [
    {
      pulpType: "ostree.content",
      apiPath: "ostree/content",
    },
    {
      pulpType: "ostree.commit",
      apiPath: "ostree/commits",
    },
    {
      pulpType: "ostree.config",
      apiPath: "ostree/configs",
    },
    {
      pulpType: "ostree.object",
      apiPath: "ostree/objects",
    },
    { pulpType: "ostree.refs", apiPath: "ostree/refs" },
    {
      pulpType: "ostree.summary",
      apiPath: "ostree/summaries",
    },
  ],
};
