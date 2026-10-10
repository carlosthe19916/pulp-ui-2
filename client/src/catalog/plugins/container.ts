import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { definePlugin, whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";

/** Shared ui + rest override for the pull-through variant (remote + distribution). */
const pullThrough = {
  ui: { label: "Container (pull-through)" },
  rest: {
    pulpType: "container.pull-through",
    apiPath: "container/pull-through",
  },
};

const containerRepositoryExtras: IEntityField[] = [
  { key: "remote", label: "Remote", type: "resource", resourceKind: "remote" },
  {
    key: "manifest_signing_service",
    label: "Manifest Signing Service",
    type: "text",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const containerPushRepositoryExtras: IEntityField[] = [
  {
    key: "manifest_signing_service",
    label: "Manifest Signing Service",
    type: "text",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const containerRepositoryDetailExtras: IEntityField[] = [
  {
    key: "manifest_signing_service",
    label: "Manifest Signing Service",
    type: "text",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const containerRemoteTagFields: IEntityField[] = [
  { key: "includes", label: "Include Tags", type: "text", group: "Advanced" },
  { key: "excludes", label: "Exclude Tags", type: "text", group: "Advanced" },
  { key: "sigstore", label: "Sigstore URL", type: "text", group: "Advanced" },
];

const containerPullThroughRemoteExtras: IEntityField[] = [
  {
    key: "includes",
    label: "Include Remotes",
    type: "text",
    group: "Advanced",
  },
  {
    key: "excludes",
    label: "Exclude Remotes",
    type: "text",
    group: "Advanced",
  },
];

const containerDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "resource",
    resourceKind: "repository",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
  { key: "private", label: "Private", type: "boolean" },
  { key: "description", label: "Description", type: "textarea" },
];

export const container = definePlugin({
  app: { isAvailable: whenInstalled("container", "pulp-container") },
  ui: { label: "Container" },
  rest: { pulpType: "container.container", apiPath: "container/container" },
  entities: {
    // container.container (sync, no publish) + container.container-push (implicit).
    repository: [
      {
        capabilities: { sync: true },
        form: {
          createFields: [
            ...repositoryBase.create,
            ...containerRepositoryExtras,
          ],
          editFields: [...repositoryBase.edit, ...containerRepositoryExtras],
        },
        page: {
          detailFields: [
            ...repositoryBase.detail,
            ...containerRepositoryDetailExtras,
          ],
        },
      },
      {
        ui: { label: "Container (push)" },
        rest: {
          pulpType: "container.container-push",
          apiPath: "container/container-push",
        },
        capabilities: { creatable: false },
        form: {
          createFields: [
            ...repositoryBase.create,
            ...containerPushRepositoryExtras,
          ],
          editFields: [
            ...repositoryBase.edit,
            ...containerPushRepositoryExtras,
          ],
        },
        page: {
          detailFields: [
            ...repositoryBase.detail,
            ...containerRepositoryDetailExtras,
          ],
        },
      },
    ],

    // container.container + container.pull-through remotes.
    remote: [
      {
        isWizard: true,
        form: {
          createFields: [
            ...remoteBase.create,
            {
              key: "upstream_name",
              label: "Upstream Name",
              type: "text",
              required: true,
              group: "General",
            },
            ...containerRemoteTagFields,
          ],
          editFields: [
            ...remoteBase.edit,
            {
              key: "upstream_name",
              label: "Upstream Name",
              type: "text",
              group: "General",
            },
            ...containerRemoteTagFields,
          ],
        },
        page: {
          detailFields: [
            ...remoteBase.detail,
            { key: "upstream_name", label: "Upstream Name", type: "text" },
            { key: "includes", label: "Include Tags", type: "text" },
            { key: "excludes", label: "Exclude Tags", type: "text" },
            { key: "sigstore", label: "Sigstore URL", type: "text" },
          ],
        },
      },
      {
        ...pullThrough,
        isWizard: true,
        form: {
          createFields: [
            ...remoteBase.create,
            ...containerPullThroughRemoteExtras,
          ],
          editFields: [...remoteBase.edit, ...containerPullThroughRemoteExtras],
        },
        page: {
          detailFields: [
            ...remoteBase.detail,
            { key: "includes", label: "Include Remotes", type: "text" },
            { key: "excludes", label: "Exclude Remotes", type: "text" },
          ],
        },
      },
    ],

    // container.container + container.pull-through distributions.
    distribution: [
      {
        form: {
          createFields: [
            ...distributionBase.create,
            ...containerDistributionExtras,
          ],
          editFields: [
            ...distributionBase.edit,
            ...containerDistributionExtras,
          ],
        },
        page: {
          detailFields: [
            ...distributionBase.detail,
            { key: "repository", label: "Repository", type: "text" },
            {
              key: "repository_version",
              label: "Repository Version",
              type: "text",
            },
            { key: "registry_path", label: "Registry Path", type: "text" },
            { key: "private", label: "Private", type: "boolean" },
            { key: "description", label: "Description", type: "text" },
          ],
          browseCardFields: [
            { key: "base_path", label: "Base path", type: "text" },
            { key: "registry_path", label: "Registry path", type: "text" },
          ],
        },
      },
      {
        ...pullThrough,
        form: {
          createFields: [
            ...distributionBase.create,
            {
              key: "remote",
              label: "Remote",
              type: "resource",
              resourceKind: "remote",
              required: true,
            },
            { key: "private", label: "Private", type: "boolean" },
            { key: "description", label: "Description", type: "textarea" },
          ],
          editFields: [
            ...distributionBase.edit,
            {
              key: "remote",
              label: "Remote",
              type: "resource",
              resourceKind: "remote",
            },
            { key: "private", label: "Private", type: "boolean" },
            { key: "description", label: "Description", type: "textarea" },
          ],
        },
        page: {
          detailFields: [
            ...distributionBase.detail,
            { key: "remote", label: "Remote", type: "text" },
            { key: "distributions", label: "Distributions", type: "text" },
            { key: "private", label: "Private", type: "boolean" },
            { key: "description", label: "Description", type: "text" },
          ],
          browseCardFields: [
            { key: "base_path", label: "Base path", type: "text" },
          ],
        },
      },
    ],
  },
});
