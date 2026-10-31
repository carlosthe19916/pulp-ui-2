import type { IEntityField } from "@app/utils/entityField";

import type { IFieldDef, IFormDef } from "../types";
import { sectionFields } from "./visibility";

/** One read-only group of an object's settings, as its form groups them. */
export interface IDetailSection {
  id: string;
  title: string;
  fields: IEntityField[];
}

const toDetailField = (field: IFieldDef): IEntityField => {
  const base = { key: field.key, label: field.label, helpText: field.help };
  switch (field.kind) {
    case "switch":
      return { ...base, type: "boolean" };
    case "resource":
      return {
        ...base,
        type: "asyncResource",
        resourceKind: field.resourceKind,
      };
    default:
      // Secrets show Set / Not set from `hidden_fields`; lists and maps render inline.
      return { ...base, type: "text" };
  }
};

/**
 * A form's sections as detail-page groups, so a detail page labels and groups settings the
 * way the form does (ADR 0010). Create-only fields (labels) and UI-only fields are left out.
 */
export const toDetailSections = (form: IFormDef): IDetailSection[] =>
  form.sections
    .map((section) => ({
      id: section.id,
      title: section.title,
      fields: sectionFields(section)
        .filter(
          (field) =>
            field.availability !== "createOnly" && !field.key.startsWith("$"),
        )
        .map(toDetailField),
    }))
    .filter((section) => section.fields.length > 0);
