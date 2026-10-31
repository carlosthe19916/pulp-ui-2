import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { rpm } from "../definition";
import { rpmActions } from "./actions";
import { rpmDistributionForm } from "./forms/distribution";
import { rpmPublicationForm } from "./forms/publication";
import { rpmRemoteForm } from "./forms/remote";
import { rpmRepositoryForm } from "./forms/repository";
import { rpmUlnRemoteForm } from "./forms/ulnRemote";

const rpmBrowse = lazyViews(() => import("./browse/RpmBrowse"));
const rpmContent = lazyViews(() => import("./content/RpmContent"));

export const rpmUi = definePluginUi({
  definition: rpm,
  ui: {
    label: "RPM",
    remote: {
      "rpm.rpm": { form: rpmRemoteForm },
      "rpm.uln": { label: "RPM (ULN)", form: rpmUlnRemoteForm },
    },
    repository: {
      "rpm.rpm": {
        form: rpmRepositoryForm,
        browse: {
          sections: [
            {
              key: "packages",
              title: "Packages",
              pulpTypes: ["rpm.package"],
              View: rpmBrowse("RpmPackages"),
            },
            {
              key: "advisories",
              title: "Advisories",
              pulpTypes: ["rpm.advisory"],
              View: rpmBrowse("RpmAdvisories"),
            },
            {
              key: "modules",
              title: "Module streams",
              pulpTypes: ["rpm.modulemd"],
              View: rpmBrowse("RpmModuleStreams"),
            },
            {
              key: "groups",
              title: "Package groups",
              pulpTypes: ["rpm.packagegroup"],
              View: rpmBrowse("RpmPackageGroups"),
            },
          ],
        },
        tab: null,
        actions: rpmActions,
      },
    },
    distribution: {
      "rpm.rpm": {
        form: rpmDistributionForm,
        clientSetup: ({ name, baseUrl }) => ({
          hint: `Save as /etc/yum.repos.d/${name}.repo.`,
          code: `[${name}]\nname=${name}\nbaseurl=${baseUrl}\nenabled=1`,
        }),
      },
    },
    publication: { "rpm.rpm": { form: rpmPublicationForm } },
    content: {
      "rpm.package": {
        panel: rpmContent("RpmContent"),
        search: { param: "name__contains", label: "name" },
        upload: [],
      },
      "rpm.advisory": {
        panel: lazyViews(() => import("./content/RpmAdvisoryContent"))(
          "RpmAdvisoryContent",
        ),
        search: { param: "id", label: "advisory ID" },
        upload: [],
      },
      "rpm.modulemd": {
        panel: lazyViews(() => import("./content/RpmModulemdContent"))(
          "RpmModulemdContent",
        ),
        search: null,
      },
      "rpm.modulemd_defaults": { panel: GENERIC, search: null },
      "rpm.modulemd_obsolete": { panel: GENERIC, search: null },
      "rpm.packagecategory": { panel: GENERIC, search: null },
      "rpm.packageenvironment": { panel: GENERIC, search: null },
      "rpm.packagegroup": {
        panel: lazyViews(() => import("./content/RpmPackageGroupContent"))(
          "RpmPackageGroupContent",
        ),
        search: null,
      },
      "rpm.packagelangpacks": { panel: GENERIC, search: null },
      "rpm.distribution_tree": { panel: GENERIC, search: null },
      "rpm.repo_metadata_file": { panel: GENERIC, search: null },
    },
    // The ACS takes the plugin's label.
    acs: {},
  },
});
