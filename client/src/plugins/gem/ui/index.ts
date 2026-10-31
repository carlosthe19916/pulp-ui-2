import { definePluginUi, lazyViews } from "@plugin-sdk/ui";

import { gem } from "../definition";
import { gemDistributionForm } from "./forms/distribution";
import { gemPublicationForm } from "./forms/publication";
import { gemRemoteForm } from "./forms/remote";
import { gemRepositoryForm } from "./forms/repository";
import { gemInstall } from "./helpers";

const gemBrowse = lazyViews(() => import("./browse/GemBrowse"));
const gemContent = lazyViews(() => import("./content/GemContent"));

export const gemUi = definePluginUi({
  definition: gem,
  ui: {
    label: "Gem",
    remote: { "gem.gem": { form: gemRemoteForm } },
    repository: {
      "gem.gem": {
        form: gemRepositoryForm,
        browse: {
          sections: [
            {
              key: "gems",
              title: "Gems",
              pulpTypes: ["gem.gem"],
              View: gemBrowse("GemGems"),
            },
          ],
        },
        tab: null,
      },
    },
    distribution: {
      "gem.gem": {
        form: gemDistributionForm,
        clientSetup: ({ baseUrl }) => ({
          hint: "Install a gem from this source.",
          code: gemInstall(baseUrl),
        }),
      },
    },
    publication: { "gem.gem": { form: gemPublicationForm } },
    content: {
      "gem.gem": {
        panel: gemContent("GemContent"),
        search: { param: "name", label: "name" },
        upload: [],
      },
    },
  },
});
