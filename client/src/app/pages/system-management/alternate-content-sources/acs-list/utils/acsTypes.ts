import type { IEntityField } from "@app/utils/entityField";
import { getAcsSources, type PluginId } from "@catalog";
import { getAcsLabel } from "@plugins";

/** One plugin's alternate content source: its collection, remote type and name. */
export interface IAcsType {
  apiPath: string;
  label: string;
  /** The plugin that must be installed. */
  pluginId: PluginId;
  /** The remote type an ACS of this plugin points at. */
  remoteType: string;
}

/** Every plugin's ACS type, from its definition (endpoint) and UI (name). */
export const getAcsTypes = (): IAcsType[] =>
  getAcsSources().map((source) => {
    const pluginId = source.pluginId as PluginId;
    return { ...source, pluginId, label: getAcsLabel(pluginId) ?? pluginId };
  });

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
