import { relativePathField } from "@app/utils/entityField";
import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { deb } from "../definition";
import { debDistributionForm } from "./forms/distribution";
import {
  debAptPublicationForm,
  debVerbatimPublicationForm,
} from "./forms/publication";
import { debRemoteForm } from "./forms/remote";
import { debRepositoryForm } from "./forms/repository";

const browse = (name: "DebReleases" | "DebPackages" | "DebSourcePackages") =>
  lazyView({ load: () => import("./browse/DebBrowse"), name });

const metadataPanel = (name: "DebReleaseContent" | "DebSourcePackageContent") =>
  lazyView({ load: () => import("./content/DebMetadataContent"), name });

export const debUi = definePluginUi(deb, {
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
            View: browse("DebReleases"),
          },
          {
            key: "packages",
            title: "Packages",
            pulpTypes: ["deb.package"],
            View: browse("DebPackages"),
          },
          {
            key: "sources",
            title: "Source packages",
            pulpTypes: ["deb.source_package"],
            View: browse("DebSourcePackages"),
          },
        ],
      },
      tab: null,
      actions: {
        copy: {
          label: "Advanced copy",
          description:
            "Copies content between repositories as described by a config.",
          fields: [
            {
              key: "config",
              label: "Config",
              type: "json",
              required: true,
              helpText:
                'A list of {"source_repo_version", "dest_repo", "content"} entries.',
            },
          ],
        },
      },
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
      panel: lazyView({
        load: () => import("./content/DebContent"),
        name: "DebContent",
      }),
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
    "deb.release": { panel: metadataPanel("DebReleaseContent"), search: null },
    "deb.release_architecture": { panel: GENERIC, search: null },
    "deb.release_component": { panel: GENERIC, search: null },
    "deb.release_file": { panel: GENERIC, search: null },
    "deb.source_index": { panel: GENERIC, search: null },
    "deb.source_package": {
      panel: metadataPanel("DebSourcePackageContent"),
      search: null,
    },
    "deb.source_package_release_component": { panel: GENERIC, search: null },
  },
  acs: { label: "Debian" },
});
