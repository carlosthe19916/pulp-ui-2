import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition } from "../types";

const mavenRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const mavenDistributionExtras: IEntityField[] = [
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

export const maven: IPluginDefinition = {
  app: { isAvailable: whenInstalled("maven", "pulp-maven") },
  ui: { label: "Maven" },
  rest: { pulpType: "maven.maven", apiPath: "maven/maven" },
  entities: {
    // Maven repository: a pull-through cache — no sync or publish (both stay off).
    repository: {
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...mavenRepositoryExtras],
        editFields: [...repositoryBase.edit, ...mavenRepositoryExtras],
      },
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
    },

    // Maven remote: no fields beyond the pulpcore remote base.
    remote: {
      form: {
        isWizard: true,
        createFields: remoteBase.create,
        editFields: remoteBase.edit,
      },
    },

    // Maven distribution: serves a repository, or pull-through via a remote.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...mavenDistributionExtras],
        editFields: [...distributionBase.edit, ...mavenDistributionExtras],
      },
    },
  },
};
