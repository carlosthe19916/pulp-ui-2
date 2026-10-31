import { relativePathField } from "@app/utils/entityField";
import { definePluginUi, lazyViews } from "@plugin-sdk/ui";

import { npm } from "../definition";
import { npmDistributionForm } from "./forms/distribution";
import { npmRemoteForm } from "./forms/remote";
import { npmRepositoryForm } from "./forms/repository";

const npmBrowse = lazyViews(() => import("./browse/NpmBrowse"));
const npmContent = lazyViews(() => import("./content/NpmContent"));

export const npmUi = definePluginUi({
  definition: npm,
  ui: {
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
              View: npmBrowse("NpmPackages"),
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
        panel: npmContent("NpmContent"),
        search: { param: "name", label: "name" },
        upload: [
          relativePathField(),
          { key: "name", label: "Name", type: "text" },
          { key: "version", label: "Version", type: "text" },
        ],
      },
    },
  },
});
