import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { python } from "../definition";
import { pythonActions } from "./actions";
import { pythonDistributionForm } from "./forms/distribution";
import { pythonPublicationForm } from "./forms/publication";
import { pythonRemoteForm } from "./forms/remote";
import { pythonRepositoryForm } from "./forms/repository";
import { pipInstall } from "./helpers";

const pythonBrowse = lazyViews(() => import("./browse/PythonBrowse"));
const pythonBlocklistTab = lazyViews(() => import("./tabs/PythonBlocklistTab"));
const pythonContent = lazyViews(() => import("./content/PythonContent"));
const bandersnatchRemoteModal = lazyViews(
  () => import("./modals/BandersnatchRemoteModal"),
);

export const pythonUi = definePluginUi({
  definition: python,
  ui: {
    label: "Python",
    remote: {
      "python.python": {
        form: pythonRemoteForm,
        createFrom: {
          bandersnatch: {
            label: "From Bandersnatch config",
            Modal: bandersnatchRemoteModal("BandersnatchRemoteModal"),
          },
        },
      },
    },
    repository: {
      "python.python": {
        form: pythonRepositoryForm,
        browse: {
          sections: [
            {
              key: "packages",
              title: "Packages",
              pulpTypes: ["python.python"],
              View: pythonBrowse("PythonPackages"),
            },
            {
              key: "yanks",
              title: "Yanked",
              pulpTypes: ["python.python_yank"],
              View: pythonBrowse("PythonYanks"),
            },
          ],
        },
        tab: {
          key: "blocklist",
          title: "Blocklist",
          Tab: pythonBlocklistTab("PythonBlocklistTab"),
        },
        actions: pythonActions,
      },
    },
    distribution: {
      "python.pypi": {
        label: "PyPI",
        form: pythonDistributionForm,
        clientSetup: ({ baseUrl }) => ({
          hint: "Install a package from this index.",
          code: pipInstall(baseUrl),
        }),
      },
    },
    publication: {
      "python.pypi": { label: "PyPI", form: pythonPublicationForm },
    },
    content: {
      "python.python": {
        panel: pythonContent("PythonContent"),
        search: { param: "name__contains", label: "name" },
        upload: [],
      },
      "python.provenance": {
        panel: GENERIC,
        search: null,
        upload: [
          {
            key: "package",
            label: "Package href",
            type: "text",
            required: true,
            helpText:
              "The pulp_href of the Python package this provenance is for.",
          },
        ],
      },
      "python.python_yank": { panel: GENERIC, search: null },
    },
  },
});
