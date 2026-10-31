import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { python } from "../definition";
import { pythonActions } from "./actions";
import { pypiDistributionForm } from "./forms/distribution";
import { pypiPublicationForm } from "./forms/publication";
import { pythonRemoteForm } from "./forms/remote";
import { pythonRepositoryForm } from "./forms/repository";

const pythonBrowse = lazyViews(() => import("./browse/PythonBrowse"));
const pythonBlocklistTab = lazyViews(() => import("./tabs/PythonBlocklistTab"));
const pythonContent = lazyViews(() => import("./content/PythonContent"));

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
            Modal: lazyViews(() => import("./modals/BandersnatchRemoteModal"))(
              "BandersnatchRemoteModal",
            ),
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
        form: pypiDistributionForm,
        clientSetup: ({ baseUrl }) => ({
          hint: "Install a package from this index.",
          code: `pip install --index-url ${baseUrl}simple/ <package>`,
        }),
      },
    },
    publication: {
      "python.pypi": { label: "PyPI", form: pypiPublicationForm },
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
