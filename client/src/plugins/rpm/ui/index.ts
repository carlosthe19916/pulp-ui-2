import type { IEntityField } from "@app/utils/entityField";
import { definePluginUi, GENERIC, lazyView } from "@plugin-sdk/ui";

import { rpm } from "../definition";
import { rpmDistributionForm } from "./forms/distribution";
import { rpmPublicationForm } from "./forms/publication";
import { rpmRemoteForm } from "./forms/remote";
import { rpmRepositoryForm } from "./forms/repository";
import { rpmUlnRemoteForm } from "./forms/ulnRemote";

/** The `/rpm/copy/` endpoint's one field: a JSON copy config. */
const copyConfigFields: IEntityField[] = [
  {
    key: "config",
    label: "Config",
    type: "json",
    required: true,
    helpText:
      'A list of {"source_repo_version", "dest_repo", "content"} entries.',
  },
];

const browse = (
  name:
    "RpmPackages" | "RpmAdvisories" | "RpmModuleStreams" | "RpmPackageGroups",
) => lazyView({ load: () => import("./browse/RpmBrowse"), name });

const metadataPanel = (
  name: "RpmAdvisoryContent" | "RpmModulemdContent" | "RpmPackageGroupContent",
) => lazyView({ load: () => import("./content/RpmMetadataContent"), name });

export const rpmUi = definePluginUi(rpm, {
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
            View: browse("RpmPackages"),
          },
          {
            key: "advisories",
            title: "Advisories",
            pulpTypes: ["rpm.advisory"],
            View: browse("RpmAdvisories"),
          },
          {
            key: "modules",
            title: "Module streams",
            pulpTypes: ["rpm.modulemd"],
            View: browse("RpmModuleStreams"),
          },
          {
            key: "groups",
            title: "Package groups",
            pulpTypes: ["rpm.packagegroup"],
            View: browse("RpmPackageGroups"),
          },
        ],
      },
      tab: null,
      actions: {
        copy: {
          label: "Advanced copy",
          description:
            "Copies content and its dependencies between repositories as described by a config.",
          fields: copyConfigFields,
        },
        comps: {
          label: "Upload comps.xml",
          fields: [
            { key: "file", label: "comps.xml", type: "file", required: true },
            {
              key: "replace",
              label: "Replace existing comps content",
              type: "boolean",
            },
          ],
        },
        prune: {
          label: "Prune packages",
          description: "Removes all but the newest version of each package.",
          fields: [
            {
              key: "keep_days",
              label: "Keep days",
              type: "number",
              defaultValue: 14,
              helpText: "Prune packages introduced before this many days ago.",
            },
            { key: "dry_run", label: "Dry run", type: "boolean" },
          ],
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
      panel: lazyView({
        load: () => import("./content/RpmContent"),
        name: "RpmContent",
      }),
      search: { param: "name__contains", label: "name" },
      upload: [],
    },
    "rpm.advisory": {
      panel: metadataPanel("RpmAdvisoryContent"),
      search: { param: "id", label: "advisory ID" },
      upload: [],
    },
    "rpm.modulemd": {
      panel: metadataPanel("RpmModulemdContent"),
      search: null,
    },
    "rpm.modulemd_defaults": { panel: GENERIC, search: null },
    "rpm.modulemd_obsolete": { panel: GENERIC, search: null },
    "rpm.packagecategory": { panel: GENERIC, search: null },
    "rpm.packageenvironment": { panel: GENERIC, search: null },
    "rpm.packagegroup": {
      panel: metadataPanel("RpmPackageGroupContent"),
      search: null,
    },
    "rpm.packagelangpacks": { panel: GENERIC, search: null },
    "rpm.distribution_tree": { panel: GENERIC, search: null },
    "rpm.repo_metadata_file": { panel: GENERIC, search: null },
  },
  acs: { label: "RPM" },
});
