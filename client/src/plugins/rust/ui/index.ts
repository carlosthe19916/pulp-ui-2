import RustIcon from "@patternfly/react-icons/dist/esm/icons/rust-icon";

import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { rust } from "../definition";
import { rustDistributionForm } from "./forms/distribution";
import { rustRemoteForm } from "./forms/remote";
import { rustRepositoryForm } from "./forms/repository";
import { cargoIndexUrl, cargoRegistryConfig } from "./helpers";

const rustBrowse = lazyViews(() => import("./browse/RustBrowse"));
const rustContent = lazyViews(() => import("./content/RustContent"));

export const rustUi = definePluginUi({
  definition: rust,
  ui: {
    label: "Rust",
    icon: RustIcon,
    remote: { "rust.rust": { form: rustRemoteForm } },
    repository: {
      "rust.rust": {
        form: rustRepositoryForm,
        browse: {
          sections: [
            {
              key: "crates",
              title: "Crates",
              pulpTypes: ["rust.rust"],
              View: rustBrowse("RustCrates"),
            },
            {
              key: "yanks",
              title: "Yanked",
              pulpTypes: ["rust.rust_yank"],
              View: rustBrowse("RustYanks"),
            },
          ],
        },
        tab: null,
        actions: {
          "add-cached-content": {
            label: "Add cached content",
            description:
              "Add the crates cached through the remote since the last version.",
            fields: [
              {
                key: "remote",
                label: "Remote",
                type: "asyncResource",
                resourceKind: "remote",
                helpText:
                  "The remote the crates were cached through. Required when the repository has no remote.",
              },
            ],
          },
        },
      },
    },
    distribution: {
      "rust.rust": {
        form: rustDistributionForm,
        clientSetup: ({ name, baseUrl, basePath }) => {
          const indexUrl = cargoIndexUrl({ baseUrl, basePath });
          return indexUrl
            ? {
                hint: "Add this registry to .cargo/config.toml. Pulp serves the index from its API host: if that differs from the content host, use the API host.",
                code: cargoRegistryConfig({ name, indexUrl }),
              }
            : null;
        },
      },
    },
    content: {
      "rust.rust": {
        panel: rustContent("RustContent"),
        search: { param: "name", label: "name" },
      },
      "rust.rust_yank": { panel: GENERIC, search: null },
    },
  },
});
