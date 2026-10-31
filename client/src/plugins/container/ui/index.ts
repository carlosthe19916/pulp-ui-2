import type { IPluginBrowse } from "@plugin-sdk/ui";
import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { container } from "../definition";
import { containerActions, containerPushActions } from "./actions";
import {
  containerDistributionForm,
  containerPullThroughDistributionForm,
} from "./forms/distribution";
import { containerPullThroughRemoteForm } from "./forms/pullThroughRemote";
import { containerRemoteForm } from "./forms/remote";
import {
  containerPushRepositoryForm,
  containerRepositoryForm,
} from "./forms/repository";

const browse: IPluginBrowse<"container.tag" | "container.manifest"> = {
  sections: [
    {
      key: "tags",
      title: "Tags",
      pulpTypes: ["container.tag"],
      View: lazyView({
        load: () => import("./browse/ContainerBrowse"),
        name: "ContainerTags",
      }),
    },
    {
      key: "manifests",
      title: "Manifests",
      pulpTypes: ["container.manifest"],
      View: lazyView({
        load: () => import("./browse/ContainerBrowse"),
        name: "ContainerManifests",
      }),
    },
  ],
};

const clientSetup = ({ registryPath }: { registryPath: string }) =>
  registryPath
    ? {
        hint: "Pull an image by tag.",
        code: `podman pull ${registryPath}:<tag>`,
      }
    : null;

export const containerUi = definePluginUi(container, {
  label: "Container",
  pages: [
    {
      label: "Container Namespaces",
      to: "/content-management/$pulpDomain/container-namespaces",
    },
  ],
  remote: {
    "container.container": { form: containerRemoteForm },
    "container.pull-through": {
      label: "Container (pull-through)",
      form: containerPullThroughRemoteForm,
    },
  },
  repository: {
    "container.container": {
      form: containerRepositoryForm,
      browse,
      tab: null,
      actions: containerActions,
    },
    "container.container-push": {
      label: "Container (push)",
      form: containerPushRepositoryForm,
      // Created only by pushing an image to the registry.
      modes: ["edit"],
      browse,
      tab: null,
      actions: containerPushActions,
    },
  },
  distribution: {
    "container.container": { form: containerDistributionForm, clientSetup },
    "container.pull-through": {
      label: "Container (pull-through)",
      form: containerPullThroughDistributionForm,
      clientSetup,
    },
  },
  content: {
    "container.blob": { panel: GENERIC, search: null },
    "container.manifest": {
      panel: lazyView({
        load: () => import("./content/ContainerContent"),
        name: "ContainerManifestContent",
      }),
      search: { param: "digest", label: "digest" },
    },
    "container.signature": { panel: GENERIC, search: null },
    "container.tag": {
      panel: lazyView({
        load: () => import("./content/ContainerContent"),
        name: "ContainerTagContent",
      }),
      search: { param: "name", label: "tag" },
    },
  },
});
