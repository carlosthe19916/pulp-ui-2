import type { IEntityField } from "@catalog";

/** One plugin's alternate content source: its collection and remote type. */
export interface IAcsType {
  apiPath: string;
  label: string;
  /** The repository pulp_type whose plugin must be installed. */
  pluginType: string;
  /** The remote pulp_type an ACS of this plugin points at. */
  remoteType: string;
}

export const ACS_TYPES: IAcsType[] = [
  {
    apiPath: "file/file",
    label: "File",
    pluginType: "file.file",
    remoteType: "file.file",
  },
  {
    apiPath: "rpm/rpm",
    label: "RPM",
    pluginType: "rpm.rpm",
    remoteType: "rpm.rpm",
  },
  {
    apiPath: "deb/deb",
    label: "Debian",
    pluginType: "deb.deb",
    remoteType: "deb.apt-remote",
  },
];

export const ACS_FIELDS: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
    required: true,
    helpText: "Its URL is where the alternate content is found.",
  },
  {
    key: "paths",
    label: "Paths",
    type: "stringList",
    helpText:
      "Paths appended to the remote URL, one source each; leave empty to use the URL itself.",
  },
];
