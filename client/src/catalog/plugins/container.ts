import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition, IRepositoryAction } from "../types";

/** Shared rest override for the pull-through variant (remote + distribution). */
const pullThrough = {
  rest: {
    pulpType: "container.pull-through",
    apiPath: "container/pull-through",
  },
};

const containerRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
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
    type: "asyncResource",
    resourceKind: "repository",
  },
  { key: "repository_version", label: "Repository Version", type: "text" },
  { key: "private", label: "Private", type: "boolean" },
  { key: "description", label: "Description", type: "textarea" },
];

const tagAction: IRepositoryAction = {
  key: "tag",
  label: "Tag image",
  path: "tag/",
  target: "repository",
  fields: [
    { key: "tag", label: "Tag", type: "text", required: true },
    {
      key: "digest",
      label: "Manifest digest",
      type: "text",
      required: true,
      helpText: "sha256 of the manifest to tag.",
    },
  ],
};

/** Also a row action on the Browse Tags view, prefilled with the tag. */
const UNTAG_ACTION: IRepositoryAction = {
  key: "untag",
  label: "Untag image",
  path: "untag/",
  target: "repository",
  fields: [{ key: "tag", label: "Tag", type: "text", required: true }],
};

const signAction: IRepositoryAction = {
  key: "sign",
  label: "Sign images",
  path: "sign/",
  target: "repository",
  fields: [
    {
      key: "manifest_signing_service",
      label: "Signing service",
      type: "asyncResource",
      resourceKind: "signingService",
      helpText: "Overrides the repository's signing service.",
    },
    {
      key: "future_base_path",
      label: "Future base path",
      type: "text",
      helpText:
        "Where the content will be distributed (for synced repositories).",
    },
    { key: "tags_list", label: "Tags", type: "stringList" },
  ],
};

const sourceFields: IEntityField[] = [
  {
    key: "source_repository",
    label: "Source repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "source_repository_version",
    label: "Source repository version",
    type: "text",
    helpText: "A version href; use instead of a source repository.",
  },
];

const containerActions: IRepositoryAction[] = [
  tagAction,
  UNTAG_ACTION,
  {
    key: "copy-tags",
    label: "Copy tags",
    path: "copy_tags/",
    target: "repository",
    fields: [
      ...sourceFields,
      {
        key: "names",
        label: "Tags",
        type: "stringList",
        helpText: "Leave empty to copy all tags.",
      },
    ],
  },
  {
    key: "copy-manifests",
    label: "Copy manifests",
    path: "copy_manifests/",
    target: "repository",
    fields: [
      ...sourceFields,
      {
        key: "digests",
        label: "Digests",
        type: "stringList",
        helpText: "Leave empty to copy all manifests.",
      },
      { key: "media_types", label: "Media types", type: "stringList" },
    ],
  },
  signAction,
  {
    key: "build-image",
    label: "Build image",
    path: "build_image/",
    target: "repository",
    description:
      "Builds an OCI image from a Containerfile into a new version (tech preview).",
    fields: [
      { key: "containerfile", label: "Containerfile", type: "file" },
      {
        key: "containerfile_name",
        label: "Containerfile name",
        type: "text",
        helpText:
          "A Containerfile from the build context, instead of an upload.",
      },
      { key: "tag", label: "Tag", type: "text" },
      {
        key: "build_context",
        label: "Build context",
        type: "text",
        helpText:
          "A repository version href whose files are the build context.",
      },
    ],
  },
];

const containerPushActions: IRepositoryAction[] = [
  tagAction,
  UNTAG_ACTION,
  {
    key: "remove-image",
    label: "Remove image",
    path: "remove_image/",
    target: "repository",
    fields: [
      {
        key: "digest",
        label: "Manifest digest",
        type: "text",
        required: true,
      },
    ],
  },
  {
    key: "remove-signatures",
    label: "Remove signatures",
    path: "remove_signatures/",
    target: "repository",
    fields: [
      {
        key: "signed_with_key_id",
        label: "Key ID",
        type: "text",
        required: true,
      },
    ],
  },
  signAction,
  {
    key: "migrate",
    label: "Convert to container repository",
    path: "migrate/",
    target: "repository",
    description:
      "Converts this push repository into a container repository in place, keeping its version history.",
    fields: [],
  },
];

export const container: IPluginDefinition = {
  app: { isAvailable: whenInstalled("container", "pulp-container") },
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
        contentChanges: "addRemove",
        archiveImport: false,
        actions: containerActions,
      },
      {
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
        contentChanges: null,
        archiveImport: false,
        actions: containerPushActions,
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
              type: "asyncResource",
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
              type: "asyncResource",
              resourceKind: "remote",
            },
            { key: "private", label: "Private", type: "boolean" },
            { key: "description", label: "Description", type: "textarea" },
          ],
        },
      },
    ],
  },

  // Container content is read-only in the API (populated by registry push / sync).
  content: [
    {
      pulpType: "container.blob",
      apiPath: "container/blobs",
    },
    {
      pulpType: "container.manifest",
      apiPath: "container/manifests",
    },
    {
      pulpType: "container.signature",
      apiPath: "container/signatures",
    },
    {
      pulpType: "container.tag",
      apiPath: "container/tags",
    },
  ],
};
