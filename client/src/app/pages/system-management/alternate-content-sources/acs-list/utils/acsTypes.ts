import type { IEntityField } from "@app/utils/entityField";

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
