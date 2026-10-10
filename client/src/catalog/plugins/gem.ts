import {
  distributionBase,
  publicationBase,
  remoteBase,
  repositoryBase,
} from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

const gemRepositoryExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
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
    type: "resource",
    resourceKind: "repository",
  },
  {
    key: "publication",
    label: "Publication",
    type: "resource",
    resourceKind: "publication",
  },
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
];

export const gem = definePlugin({
  app: { isAvailable: whenInstalled("gem", "pulp-gem") },
  ui: { label: "Gem" },
  rest: { pulpType: "gem.gem", apiPath: "gem/gem" },
  entities: {
    // Gem repository: a remote to sync from.
    repository: {
      capabilities: { sync: true, publish: true },
      form: {
        createFields: [...repositoryBase.create, ...gemRepositoryExtras],
        editFields: [...repositoryBase.edit, ...gemRepositoryExtras],
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

    // Gem remote: prerelease handling plus include/exclude filters.
    remote: {
      isWizard: true,
      form: {
        createFields: [...remoteBase.create, ...gemRemoteExtras],
        editFields: [...remoteBase.edit, ...gemRemoteExtras],
      },
      page: {
        detailFields: [
          ...remoteBase.detail,
          { key: "prereleases", label: "Prereleases", type: "boolean" },
          { key: "includes", label: "Includes", type: "text" },
          { key: "excludes", label: "Excludes", type: "text" },
        ],
      },
    },

    // Gem distribution: serves a repository/publication, optionally pull-through.
    distribution: {
      form: {
        createFields: [...distributionBase.create, ...gemDistributionExtras],
        editFields: [...distributionBase.edit, ...gemDistributionExtras],
      },
      page: {
        detailFields: [
          ...distributionBase.detail,
          { key: "repository", label: "Repository", type: "text" },
          { key: "publication", label: "Publication", type: "text" },
          { key: "remote", label: "Remote", type: "text" },
        ],
        browseCardFields: [
          { key: "base_path", label: "Base path", type: "text" },
          { key: "base_url", label: "Base URL", type: "text" },
        ],
      },
    },

    // Gem publication: base supplies the repository; adds repository_version.
    publication: {
      form: {
        createFields: [
          ...publicationBase.create,
          {
            key: "repository_version",
            label: "Repository Version",
            type: "text",
          },
        ],
      },
      page: { detailFields: publicationBase.detail },
    },
  },
});
