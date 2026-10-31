import { relativePathField } from "@app/utils/entityField";
import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { deb } from "../definition";
import { debActions } from "./actions";
import { debDistributionForm } from "./forms/distribution";
import {
  debAptPublicationForm,
  debVerbatimPublicationForm,
} from "./forms/publication";
import { debRemoteForm } from "./forms/remote";
import { debRepositoryForm } from "./forms/repository";

const debBrowse = lazyViews(() => import("./browse/DebBrowse"));
const debMetadataContent = lazyViews(
  () => import("./content/DebMetadataContent"),
);
const debContent = lazyViews(() => import("./content/DebContent"));

export const debUi = definePluginUi({
  definition: deb,
  ui: {
    label: "APT",
    remote: { "deb.apt-remote": { form: debRemoteForm } },
    repository: {
      "deb.deb": {
        form: debRepositoryForm,
        browse: {
          sections: [
            {
              key: "releases",
              title: "Releases",
              pulpTypes: ["deb.release"],
              View: debBrowse("DebReleases"),
            },
            {
              key: "packages",
              title: "Packages",
              pulpTypes: ["deb.package"],
              View: debBrowse("DebPackages"),
            },
            {
              key: "sources",
              title: "Source packages",
              pulpTypes: ["deb.source_package"],
              View: debBrowse("DebSourcePackages"),
            },
          ],
        },
        tab: null,
        actions: debActions,
      },
    },
    distribution: {
      "deb.apt-distribution": {
        form: debDistributionForm,
        clientSetup: ({ baseUrl }) => ({
          hint: "Add to /etc/apt/sources.list.d/.",
          code: `deb ${baseUrl} <distribution> <component>`,
        }),
      },
    },
    publication: {
      "deb.apt-publication": { form: debAptPublicationForm },
      "deb.verbatim-publication": {
        label: "APT (verbatim)",
        form: debVerbatimPublicationForm,
      },
    },
    content: {
      "deb.package": {
        panel: debContent("DebContent"),
        search: null,
        upload: [
          relativePathField(),
          { key: "distribution", label: "Distribution", type: "text" },
          { key: "component", label: "Component", type: "text" },
        ],
      },
      "deb.generic": {
        panel: GENERIC,
        search: null,
        upload: [relativePathField({ required: true })],
      },
      "deb.installer_file_index": { panel: GENERIC, search: null },
      "deb.installer_package": {
        panel: GENERIC,
        search: null,
        upload: [relativePathField()],
      },
      "deb.package_index": { panel: GENERIC, search: null },
      "deb.package_release_component": { panel: GENERIC, search: null },
      "deb.release": {
        panel: debMetadataContent("DebReleaseContent"),
        search: null,
      },
      "deb.release_architecture": { panel: GENERIC, search: null },
      "deb.release_component": { panel: GENERIC, search: null },
      "deb.release_file": { panel: GENERIC, search: null },
      "deb.source_index": { panel: GENERIC, search: null },
      "deb.source_package": {
        panel: debMetadataContent("DebSourcePackageContent"),
        search: null,
      },
      "deb.source_package_release_component": { panel: GENERIC, search: null },
    },
    acs: { label: "Debian" },
  },
});
