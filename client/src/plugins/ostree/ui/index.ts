import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { ostree } from "../definition";
import { ostreeDistributionForm } from "./forms/distribution";
import { ostreeRemoteForm } from "./forms/remote";
import { ostreeRepositoryForm } from "./forms/repository";

const ostreeBrowse = lazyViews(() => import("./browse/OstreeBrowse"));
const ostreeContent = lazyViews(() => import("./content/OstreeContent"));
const ostreeRefContent = lazyViews(() => import("./content/OstreeRefContent"));

export const ostreeUi = definePluginUi({
  definition: ostree,
  ui: {
    label: "OSTree",
    remote: { "ostree.ostree": { form: ostreeRemoteForm } },
    repository: {
      "ostree.ostree": {
        form: ostreeRepositoryForm,
        archiveImport: {
          label: "Import archive",
          Modal: lazyViews(() => import("./modals/OstreeImportModal"))(
            "OstreeImportModal",
          ),
        },
        browse: {
          sections: [
            {
              key: "branches",
              title: "Branches",
              pulpTypes: ["ostree.refs"],
              View: ostreeBrowse("OstreeBranches"),
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
        panel: ostreeContent("OstreeContent"),
        search: null,
      },
      "ostree.commit": { panel: GENERIC, search: null },
      "ostree.config": { panel: GENERIC, search: null },
      "ostree.object": { panel: GENERIC, search: null },
      "ostree.refs": {
        panel: ostreeRefContent("OstreeRefContent"),
        search: null,
      },
      "ostree.summary": { panel: GENERIC, search: null },
    },
  },
});
