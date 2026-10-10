import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

const mavenRepositoryExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const mavenDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "resource",
    resourceKind: "repository",
  },
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
];

export const maven = definePlugin({
  app: { isAvailable: whenInstalled("maven", "pulp-maven") },
  ui: { label: "Maven" },
  rest: { pulpType: "maven.maven", apiPath: "maven/maven" },
  entities: {
    // Maven repository: a pull-through cache — no sync or publish (both stay off).
    repository: {
      form: {
        createFields: [...repositoryBase.create, ...mavenRepositoryExtras],
        editFields: [...repositoryBase.edit, ...mavenRepositoryExtras],
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

    // Maven remote: no fields beyond the pulpcore remote base.
    remote: {
      isWizard: true,
      form: { createFields: remoteBase.create, editFields: remoteBase.edit },
      page: { detailFields: remoteBase.detail },
    },

    // Maven distribution: serves a repository, or pull-through via a remote.
    distribution: {
      form: {
        createFields: [...distributionBase.create, ...mavenDistributionExtras],
        editFields: [...distributionBase.edit, ...mavenDistributionExtras],
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
