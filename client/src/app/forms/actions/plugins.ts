import type { IEntityField } from "@app/utils/entityField";

import type { ActionFields } from "./types";

/** The `/…/copy/` endpoints' one field: a JSON copy config. */
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

/** Fields of the RPM repository actions, by action key. */
export const RPM_ACTION_FIELDS: ActionFields = {
  copy: copyConfigFields,
  comps: [
    { key: "file", label: "comps.xml", type: "file", required: true },
    {
      key: "replace",
      label: "Replace existing comps content",
      type: "boolean",
    },
  ],
  prune: [
    {
      key: "keep_days",
      label: "Keep days",
      type: "number",
      defaultValue: 14,
      helpText: "Prune packages introduced before this many days ago.",
    },
    { key: "dry_run", label: "Dry run", type: "boolean" },
  ],
  scan: [],
};

export const DEB_ACTION_FIELDS: ActionFields = {
  copy: copyConfigFields,
};

export const MAVEN_ACTION_FIELDS: ActionFields = {
  "repair-metadata": [],
  "repair-packages": [],
  "repair-index-pages": [],
  "build-path-index": [],
  "compact-path-index": [],
};

export const PYTHON_ACTION_FIELDS: ActionFields = {
  "repair-metadata": [],
  scan: [],
};
