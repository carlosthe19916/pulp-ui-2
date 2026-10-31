import { definePluginUi, lazyView } from "@plugin-sdk/ui";

import { gem } from "../definition";
import { gemDistributionForm } from "./forms/distribution";
import { gemPublicationForm } from "./forms/publication";
import { gemRemoteForm } from "./forms/remote";
import { gemRepositoryForm } from "./forms/repository";

export const gemUi = definePluginUi(gem, {
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
            View: lazyView({
              load: () => import("./browse/GemBrowse"),
              name: "GemGems",
            }),
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
        code: `gem install --source ${baseUrl} <gem>`,
      }),
    },
  },
  publication: { "gem.gem": { form: gemPublicationForm } },
  content: {
    "gem.gem": {
      panel: lazyView({
        load: () => import("./content/GemContent"),
        name: "GemContent",
      }),
      search: { param: "name", label: "name" },
      upload: [],
    },
  },
});
