import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

/** Shared rest override for the PyPI variant (distribution + publication). */
const pypi = {
  rest: { pulpType: "python.pypi", apiPath: "python/pypi" },
};

const pythonActions: IRepositoryAction[] = [
  {
    key: "repair-metadata",
    label: "Repair metadata",
    path: "repair_metadata/",
    target: "repository",
    description:
      "Repairs the metadata of every package without creating a new version.",
  },
  {
    key: "scan",
    label: "Scan for vulnerabilities",
    path: "scan/",
    target: "version",
    description:
      "Checks this version's packages against known vulnerabilities and stores a report.",
  },
];

export const python: IPluginDefinition = {
  app: { isAvailable: whenInstalled("python", "pulp-python") },
  rest: { pulpType: "python.python", apiPath: "python/python" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["python.python"],
      compatiblePublicationTypes: ["python.pypi"],
      contentChanges: "modify",
      archiveImport: false,
      actions: pythonActions,
    },

    remote: {},

    distribution: {
      ...pypi,
    },

    publication: {
      ...pypi,
    },
  },

  content: [
    {
      pulpType: "python.python",
      apiPath: "python/packages",
      uploadable: { mechanism: "upload" },
    },
    {
      pulpType: "python.provenance",
      apiPath: "python/provenance",
      uploadable: {
        mechanism: "create",
      },
    },
    {
      pulpType: "python.python_yank",
      apiPath: "python/yanks",
    },
  ],
};
