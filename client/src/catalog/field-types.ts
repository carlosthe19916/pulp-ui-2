import type { EntityType } from "./types";

/**
 * The field model, shared by form and page. Discriminated on `type`: a `select`
 * requires `options`, a `resource` requires `resourceKind`, plain fields neither.
 */

export type FieldType =
  "text" | "textarea" | "number" | "boolean" | "select" | "file" | "resource";

/** A single choice in a `select` field. */
export interface IFieldOption {
  value: string;
  label: string;
}

/** Properties common to every field, regardless of type. */
interface IFieldBase {
  key: string;
  label: string;
  required?: boolean;
  defaultValue?: unknown;
  /** Wizard step this field belongs to (when the form renders as a wizard). */
  group?: string;
}

/** Plain input fields — no options, no resource picker. */
interface IBasicField extends IFieldBase {
  type: Exclude<FieldType, "select" | "resource">;
}

/** A dropdown — `options` is required. */
interface ISelectField extends IFieldBase {
  type: "select";
  options: IFieldOption[];
}

/** A resource picker — `resourceKind` is required. */
interface IResourceField extends IFieldBase {
  type: "resource";
  resourceKind: EntityType;
}

/** A single form/page field. */
export type IEntityField = IBasicField | ISelectField | IResourceField;
