import type { TypesOf } from "@plugin-sdk/definition";
import {
  type ClientSetup,
  definePluginUi,
  GENERIC,
  type IPluginBrowse,
  lazyViews,
} from "@plugin-sdk/ui";

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

const containerBrowse = lazyViews(() => import("./browse/ContainerBrowse"));

const browse: IPluginBrowse<TypesOf<typeof container, "content">> = {
  sections: [
    {
      key: "tags",
      title: "Tags",
      pulpTypes: ["container.tag"],
      View: containerBrowse("ContainerTags"),
    },
    {
      key: "manifests",
      title: "Manifests",
      pulpTypes: ["container.manifest"],
      View: containerBrowse("ContainerManifests"),
    },
  ],
};

const clientSetup: ClientSetup = ({ registryPath }) =>
  registryPath
    ? {
        hint: "Pull an image by tag.",
        code: `podman pull ${registryPath}:<tag>`,
      }
    : null;

export const containerUi = definePluginUi({
  definition: container,
  ui: {
    label: "Container",
    pages: [
      {
        label: "Container Namespaces",
        to: "/content-management/$pulpDomain/container-namespaces",
        Page: lazyViews(() => import("./pages/ContainerNamespaceList"))(
          "ContainerNamespaceList",
        ),
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
        panel: lazyViews(() => import("./content/ContainerManifestContent"))(
          "ContainerManifestContent",
        ),
        search: { param: "digest", label: "digest" },
      },
      "container.signature": { panel: GENERIC, search: null },
      "container.tag": {
        panel: lazyViews(() => import("./content/ContainerTagContent"))(
          "ContainerTagContent",
        ),
        search: { param: "name", label: "tag" },
      },
    },
  },
});
