import { definePlugin } from "@plugin-sdk/definition";

/** Python: packages synced from PyPI and served as a PyPI index (`python.pypi`). */
export const python = definePlugin({
  id: "python",
  packages: ["python", "pulp-python"],
  remote: { "python.python": { apiPath: "python/python" } },
  repository: {
    "python.python": {
      apiPath: "python/python",
      compatibleRemoteTypes: ["python.python"],
      compatiblePublicationTypes: ["python.pypi"],
      contentChanges: "modify",
      scan: true,
      actions: {
        "repair-metadata": { path: "repair_metadata/", target: "repository" },
        scan: { path: "scan/", target: "version" },
      },
    },
  },
  distribution: { "python.pypi": { apiPath: "python/pypi" } },
  publication: { "python.pypi": { apiPath: "python/pypi" } },
  content: {
    "python.python": { apiPath: "python/packages", upload: "upload" },
    "python.provenance": { apiPath: "python/provenance", upload: "create" },
    "python.python_yank": { apiPath: "python/yanks" },
  },
});
