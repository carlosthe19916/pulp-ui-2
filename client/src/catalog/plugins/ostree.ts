import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
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
  ui: { label: "OSTree" },
  rest: { pulpType: "ostree.ostree", apiPath: "ostree/ostree" },
  entities: {
    // OSTree repository: a remote to sync from plus static-delta generation.
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...ostreeRepositoryExtras],
        editFields: [...repositoryBase.edit, ...ostreeRepositoryExtras],
      },
      compatibleRemoteTypes: ["ostree.ostree"],
      compatiblePublicationTypes: [],
    },

    // OSTree remote: sync depth plus ref include/exclude filters.
    remote: {
      form: {
        isWizard: true,
        createFields: [...remoteBase.create, ...ostreeRemoteExtras],
        editFields: [...remoteBase.edit, ...ostreeRemoteExtras],
      },
    },

    // OSTree distribution: serves a repository or a specific repository version.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...ostreeDistributionExtras],
        editFields: [...distributionBase.edit, ...ostreeDistributionExtras],
      },
    },
  },
};
