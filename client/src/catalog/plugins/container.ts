import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition } from "../types";

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

export const container: IPluginDefinition = {
  app: { isAvailable: whenInstalled("container", "pulp-container") },
  ui: { label: "Container" },
  rest: { pulpType: "container.container", apiPath: "container/container" },
  entities: {
    // container.container (sync, no publish) + container.container-push (implicit).
    repository: [
      {
        form: {
          isWizard: false,
          createFields: [
            ...repositoryBase.create,
            ...containerRepositoryExtras,
          ],
          editFields: [...repositoryBase.edit, ...containerRepositoryExtras],
        },
        compatibleRemoteTypes: ["container.container"],
        compatiblePublicationTypes: [],
      },
      {
        ui: { label: "Container (push)" },
        rest: {
          pulpType: "container.container-push",
          apiPath: "container/container-push",
        },
        form: {
          isWizard: false,
          createFields: [
            ...repositoryBase.create,
            ...containerPushRepositoryExtras,
          ],
          editFields: [
            ...repositoryBase.edit,
            ...containerPushRepositoryExtras,
          ],
        },
        compatibleRemoteTypes: [],
        compatiblePublicationTypes: [],
      },
    ],

    // container.container + container.pull-through remotes.
    remote: [
      {
        form: {
          isWizard: true,
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
      },
      {
        ...pullThrough,
        form: {
          isWizard: true,
          createFields: [
            ...remoteBase.create,
            ...containerPullThroughRemoteExtras,
          ],
          editFields: [...remoteBase.edit, ...containerPullThroughRemoteExtras],
        },
      },
    ],

    // container.container + container.pull-through distributions.
    distribution: [
      {
        form: {
          isWizard: false,
          createFields: [
            ...distributionBase.create,
            ...containerDistributionExtras,
          ],
          editFields: [
            ...distributionBase.edit,
            ...containerDistributionExtras,
          ],
        },
      },
      {
        ...pullThrough,
        form: {
          isWizard: false,
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
      },
    ],
  },
};
