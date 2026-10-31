import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

/** Shared rest override for the pull-through variant (remote + distribution). */
const pullThrough = {
  rest: {
    pulpType: "container.pull-through",
    apiPath: "container/pull-through",
  },
};

const tagAction: IRepositoryAction = {
  key: "tag",
  label: "Tag image",
  path: "tag/",
  target: "repository",
};

/** Also a row action on the Browse Tags view, prefilled with the tag. */
const UNTAG_ACTION: IRepositoryAction = {
  key: "untag",
  label: "Untag image",
  path: "untag/",
  target: "repository",
};

const signAction: IRepositoryAction = {
  key: "sign",
  label: "Sign images",
  path: "sign/",
  target: "repository",
};

const containerActions: IRepositoryAction[] = [
  tagAction,
  UNTAG_ACTION,
  {
    key: "copy-tags",
    label: "Copy tags",
    path: "copy_tags/",
    target: "repository",
  },
  {
    key: "copy-manifests",
    label: "Copy manifests",
    path: "copy_manifests/",
    target: "repository",
  },
  signAction,
  {
    key: "build-image",
    label: "Build image",
    path: "build_image/",
    target: "repository",
    description:
      "Builds an OCI image from a Containerfile into a new version (tech preview).",
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
  },
  {
    key: "remove-signatures",
    label: "Remove signatures",
    path: "remove_signatures/",
    target: "repository",
  },
  signAction,
  {
    key: "migrate",
    label: "Convert to container repository",
    path: "migrate/",
    target: "repository",
    description:
      "Converts this push repository into a container repository in place, keeping its version history.",
  },
];

export const container: IPluginDefinition = {
  app: { isAvailable: whenInstalled("container", "pulp-container") },
  rest: { pulpType: "container.container", apiPath: "container/container" },
  entities: {
    // container.container (sync, no publish) + container.container-push (implicit).
    repository: [
      {
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
        compatibleRemoteTypes: [],
        compatiblePublicationTypes: [],
        contentChanges: null,
        archiveImport: false,
        actions: containerPushActions,
      },
    ],

    // container.container + container.pull-through remotes.
    remote: [
      {},
      {
        ...pullThrough,
      },
    ],

    // container.container + container.pull-through distributions.
    distribution: [
      {},
      {
        ...pullThrough,
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
