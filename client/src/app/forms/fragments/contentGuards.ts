import type { IEntityField } from "@app/utils/entityField";

/** The fields every content guard's modal starts with. */
export const contentGuardBaseFields: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
];
