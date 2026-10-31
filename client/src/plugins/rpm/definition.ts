import { definePlugin } from "@plugin-sdk/definition";

/** RPM: packages and their metadata; its ULN remote syncs Oracle's network channels. */
export const rpm = definePlugin({
  id: "rpm",
  packages: ["rpm", "pulp-rpm"],
  remote: {
    "rpm.rpm": { apiPath: "rpm/rpm" },
    "rpm.uln": { apiPath: "rpm/uln" },
  },
  repository: {
    "rpm.rpm": {
      apiPath: "rpm/rpm",
      compatibleRemoteTypes: ["rpm.rpm", "rpm.uln"],
      compatiblePublicationTypes: ["rpm.rpm"],
      contentChanges: "modify",
      scan: true,
      actions: {
        copy: { path: "/rpm/copy/", target: "repository" },
        comps: {
          path: "/rpm/comps/",
          target: "repository",
          repositoryParam: { key: "repository" },
        },
        prune: {
          path: "/rpm/prune/",
          target: "repository",
          repositoryParam: { key: "repo_hrefs", list: true },
        },
        scan: { path: "scan/", target: "version" },
      },
    },
  },
  distribution: { "rpm.rpm": { apiPath: "rpm/rpm" } },
  publication: { "rpm.rpm": { apiPath: "rpm/rpm" } },
  // Packages upload synchronously; an advisory uploads its JSON as a task.
  content: {
    "rpm.package": { apiPath: "rpm/packages", upload: "upload" },
    "rpm.advisory": { apiPath: "rpm/advisories", upload: "create" },
    "rpm.modulemd": { apiPath: "rpm/modulemds" },
    "rpm.modulemd_defaults": { apiPath: "rpm/modulemd_defaults" },
    "rpm.modulemd_obsolete": { apiPath: "rpm/modulemd_obsoletes" },
    "rpm.packagecategory": { apiPath: "rpm/packagecategories" },
    "rpm.packageenvironment": { apiPath: "rpm/packageenvironments" },
    "rpm.packagegroup": { apiPath: "rpm/packagegroups" },
    "rpm.packagelangpacks": { apiPath: "rpm/packagelangpacks" },
    "rpm.distribution_tree": { apiPath: "rpm/distribution_trees" },
    "rpm.repo_metadata_file": { apiPath: "rpm/repo_metadata_files" },
  },
  acs: { apiPath: "rpm/rpm", remoteType: "rpm.rpm" },
});
