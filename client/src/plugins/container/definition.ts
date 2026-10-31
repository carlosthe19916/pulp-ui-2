import { definePlugin } from "@plugin-sdk/definition";

const tag = { path: "tag/", target: "repository" } as const;
const untag = { path: "untag/", target: "repository" } as const;
const sign = { path: "sign/", target: "repository" } as const;

/** Container: an OCI registry; pull-through remotes and distributions cache images on pull. */
export const container = definePlugin({
  id: "container",
  packages: ["container", "pulp-container"],
  remote: {
    "container.container": { apiPath: "container/container" },
    "container.pull-through": { apiPath: "container/pull-through" },
  },
  repository: {
    "container.container": {
      apiPath: "container/container",
      compatibleRemoteTypes: ["container.container"],
      compatiblePublicationTypes: [],
      contentChanges: "addRemove",
      actions: {
        tag,
        untag,
        "copy-tags": { path: "copy_tags/", target: "repository" },
        "copy-manifests": { path: "copy_manifests/", target: "repository" },
        sign,
        "build-image": { path: "build_image/", target: "repository" },
      },
    },
    // Created by pushing an image to the registry; it has no create endpoint.
    "container.container-push": {
      apiPath: "container/container-push",
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: null,
      actions: {
        tag,
        untag,
        "remove-image": { path: "remove_image/", target: "repository" },
        "remove-signatures": {
          path: "remove_signatures/",
          target: "repository",
        },
        sign,
        migrate: { path: "migrate/", target: "repository" },
      },
    },
  },
  distribution: {
    "container.container": { apiPath: "container/container" },
    "container.pull-through": { apiPath: "container/pull-through" },
  },
  // Read-only in the API: populated by registry push or sync.
  content: {
    "container.blob": { apiPath: "container/blobs" },
    "container.manifest": { apiPath: "container/manifests" },
    "container.signature": { apiPath: "container/signatures" },
    "container.tag": { apiPath: "container/tags" },
  },
});
