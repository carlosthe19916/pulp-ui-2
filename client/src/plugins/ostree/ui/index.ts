import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { ostree } from "../definition";
import { ostreeDistributionForm } from "./forms/distribution";
import { ostreeRemoteForm } from "./forms/remote";
import { ostreeRepositoryForm } from "./forms/repository";

export const ostreeUi = definePluginUi(ostree, {
  label: "OSTree",
  remote: { "ostree.ostree": { form: ostreeRemoteForm } },
  repository: {
    "ostree.ostree": {
      form: ostreeRepositoryForm,
      browse: {
        sections: [
          {
            key: "branches",
            title: "Branches",
            pulpTypes: ["ostree.refs"],
            View: lazyView({
              load: () => import("./browse/OstreeBrowse"),
              name: "OstreeBranches",
            }),
          },
        ],
      },
      tab: null,
    },
  },
  distribution: {
    "ostree.ostree": {
      form: ostreeDistributionForm,
      clientSetup: ({ name, baseUrl }) => ({
        hint: "Add this repository as an OSTree remote.",
        code: `ostree remote add ${name} ${baseUrl}`,
      }),
    },
  },
  content: {
    "ostree.content": {
      panel: lazyView({
        load: () => import("./content/OstreeContent"),
        name: "OstreeContent",
      }),
      search: null,
    },
    "ostree.commit": { panel: GENERIC, search: null },
    "ostree.config": { panel: GENERIC, search: null },
    "ostree.object": { panel: GENERIC, search: null },
    "ostree.refs": {
      panel: lazyView({
        load: () => import("./content/OstreeRefContent"),
        name: "OstreeRefContent",
      }),
      search: null,
    },
    "ostree.summary": { panel: GENERIC, search: null },
  },
});
