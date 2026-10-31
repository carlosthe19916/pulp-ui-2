import { relativePathField } from "@app/utils/entityFieldPresets";
import { definePluginUi, lazyViews } from "@plugin-sdk/ui";

import { npm } from "../definition";
import { npmDistributionForm } from "./forms/distribution";
import { npmRemoteForm } from "./forms/remote";
import { npmRepositoryForm } from "./forms/repository";
import { npmInstall } from "./helpers";

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
          hint: "Install a package from this registry.",
          code: npmInstall(baseUrl),
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
