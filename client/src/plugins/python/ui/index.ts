import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { python } from "../definition";
import { pypiDistributionForm } from "./forms/distribution";
import { pypiPublicationForm } from "./forms/publication";
import { pythonRemoteForm } from "./forms/remote";
import { pythonRepositoryForm } from "./forms/repository";

const browse = (name: "PythonPackages" | "PythonYanks") =>
  lazyView({ load: () => import("./browse/PythonBrowse"), name });

export const pythonUi = definePluginUi(python, {
  label: "Python",
  remote: { "python.python": { form: pythonRemoteForm } },
  repository: {
    "python.python": {
      form: pythonRepositoryForm,
      browse: {
        sections: [
          {
            key: "packages",
            title: "Packages",
            pulpTypes: ["python.python"],
            View: browse("PythonPackages"),
          },
          {
            key: "yanks",
            title: "Yanked",
            pulpTypes: ["python.python_yank"],
            View: browse("PythonYanks"),
          },
        ],
      },
      tab: {
        key: "blocklist",
        title: "Blocklist",
        Tab: lazyView({
          load: () => import("./tabs/PythonBlocklistTab"),
          name: "PythonBlocklistTab",
        }),
      },
      actions: {
        "repair-metadata": {
          label: "Repair metadata",
          description:
            "Repairs the metadata of every package without creating a new version.",
          fields: [],
        },
        scan: {
          label: "Scan for vulnerabilities",
          description:
            "Checks this version's packages against known vulnerabilities and stores a report.",
          fields: [],
        },
      },
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
  publication: { "python.pypi": { label: "PyPI", form: pypiPublicationForm } },
  content: {
    "python.python": {
      panel: lazyView({
        load: () => import("./content/PythonContent"),
        name: "PythonContent",
      }),
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
});
