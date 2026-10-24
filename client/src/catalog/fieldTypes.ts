import type { EntityType } from "./types";

/**
 * The field model, shared by form and page. Discriminated on `type`: a `select`
 * requires `options`, an `asyncResource` requires `resourceKind`, plain fields
 * neither.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "file"
  | "asyncResource"
  | "stringList"
  | "json"
  | "content";

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
  /** Contextual help, shown as a popover on forms and detail pages. */
  helpText?: string;
}

/**
 * Plain input fields — no options, no resource picker. `stringList` is a list of
 * strings (one per line); `json` is a JSON document, parsed on submit.
 */
interface IBasicField extends IFieldBase {
  type: Exclude<FieldType, "select" | "asyncResource" | "content">;
}

/** A dropdown — `options` is required. */
interface ISelectField extends IFieldBase {
  type: "select";
  options: IFieldOption[];
}

/**
 * An async resource picker — `resourceKind` is required. Options are not
 * enumerated here: they are fetched on demand (server-side typeahead) from the
 * `resourceKind`'s collection as the user opens/types in the dropdown.
 */
interface IAsyncResourceField extends IFieldBase {
  type: "asyncResource";
  resourceKind: ResourceKind;
  /** The value is a list of hrefs instead of one. */
  multiple?: boolean;
}

/** What an `asyncResource` field picks: a catalog entity or a supporting resource. */
export type ResourceKind = EntityType | "signingService" | "contentGuard";

/**
 * Content units picked from the current repository's latest version; the value is
 * a list of content hrefs.
 */
interface IContentField extends IFieldBase {
  type: "content";
  pulpTypes: string[];
}

/** A single form/page field. */
export type IEntityField =
  IBasicField | ISelectField | IAsyncResourceField | IContentField;
