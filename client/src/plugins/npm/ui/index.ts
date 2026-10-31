import { relativePathField } from "@app/utils/entityField";
import { definePluginUi, lazyView } from "@plugin-sdk/ui";

import { npm } from "../definition";
import { npmDistributionForm } from "./forms/distribution";
import { npmRemoteForm } from "./forms/remote";
import { npmRepositoryForm } from "./forms/repository";

export const npmUi = definePluginUi(npm, {
  label: "npm",
  remote: { "npm.npm": { form: npmRemoteForm } },
  repository: {
    "npm.npm": {
      form: npmRepositoryForm,
      browse: {
        sections: [
          {
            key: "packages",
            title: "Packages",
            pulpTypes: ["npm.package"],
            View: lazyView({
              load: () => import("./browse/NpmBrowse"),
              name: "NpmPackages",
            }),
          },
        ],
      },
      tab: null,
    },
  },
  distribution: {
    "npm.npm": {
      form: npmDistributionForm,
      clientSetup: ({ baseUrl }) => ({
        hint: "Use this registry for npm installs.",
        code: `npm config set registry ${baseUrl}`,
      }),
    },
  },
  content: {
    "npm.package": {
      panel: lazyView({
        load: () => import("./content/NpmContent"),
        name: "NpmContent",
      }),
      search: { param: "name", label: "name" },
      upload: [
        relativePathField(),
        { key: "name", label: "Name", type: "text" },
        { key: "version", label: "Version", type: "text" },
      ],
    },
  },
});
