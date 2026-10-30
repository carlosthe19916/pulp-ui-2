import type React from "react";

import type { ResourceKind } from "@catalog";
import type { AnySchema } from "yup";

/** Whether a form page creates a new object or edits an existing one. */
export type FormMode = "create" | "edit";

/** react-hook-form values: the UI shape of every field, keyed by field key. */
export type FormValues = Record<string, unknown>;

/** What predicates and summaries see: the mode, the current values and the edited object. */
export interface IFormContext {
  mode: FormMode;
  values: FormValues;
  entity?: Record<string, unknown>;
}

export type FormPredicate = (ctx: IFormContext) => boolean;

/** A request-body key of `T`. */
export type BodyKey<T> = Extract<keyof T, string>;

/** A UI-only key, never sent (e.g. `$source`, a radio choosing which field applies). */
export type VirtualKey = `$${string}`;

/** When a field is offered: on both forms, only one, or shown read-only on edit. */
export type FieldAvailability =
  "both" | "createOnly" | "editOnly" | "readOnlyOnEdit";

export interface IFieldWarning {
  when: FormPredicate;
  message: string;
}

/** Options every field kind accepts. */
export interface IFieldOptions {
  label: string;
  help?: string;
  placeholder?: string;
  /** `"create"`: required on create only (e.g. a write-only secret kept on edit). */
  required?: boolean | "create";
  availability?: FieldAvailability;
  defaultValue?: unknown;
  visibleWhen?: FormPredicate;
  disabledWhen?: FormPredicate;
  warnings?: IFieldWarning[];
  /** Extends the derived yup schema (extra format checks). */
  validate?: (schema: AnySchema) => AnySchema;
  /** The form value read from the edited object; overrides the kind's codec. */
  fromEntity?: (entity: Record<string, unknown>) => unknown;
  /** The body value sent for a form value; overrides the kind's codec. */
  toBody?: (value: unknown, values: FormValues) => unknown;
  /** What an edit sends when the user empties the field; default from the kind. */
  clearAs?: unknown;
}

export interface IChoiceOption<V = string> {
  value: V;
  label: string;
  description?: string;
}

interface IFieldBase<K extends string> extends IFieldOptions {
  key: K;
}

type SimpleKind = "text" | "url" | "textarea" | "number" | "switch";

export interface ISimpleField<
  K extends string,
  Kd extends SimpleKind = SimpleKind,
> extends IFieldBase<K> {
  kind: Kd;
}

type ChoiceKind = "select" | "radio" | "tiles";

export interface IChoiceField<
  K extends string,
  Kd extends ChoiceKind = ChoiceKind,
> extends IFieldBase<K> {
  kind: Kd;
  options: IChoiceOption<unknown>[];
}

export interface IStringListField<K extends string> extends IFieldBase<K> {
  kind: "stringList";
}

export interface IKeyValueField<K extends string> extends IFieldBase<K> {
  kind: "keyValue";
  /** `headers`: Pulp's `[{ name: value }]`; `labels`: a `{ key: value }` object. */
  shape: "headers" | "labels";
}

export interface ISecretField<K extends string> extends IFieldBase<K> {
  kind: "secret";
  /** Edit a PEM private key in the code editor instead of a password input. */
  editor?: "pem";
}

export type CodeLanguage = "yaml" | "json" | "pem";

export interface ICodeField<K extends string> extends IFieldBase<K> {
  kind: "code";
  language: CodeLanguage;
  /** Starter text offered by "Use template" while the field is empty. */
  template?: string;
  downloadName?: string;
}

export interface IFileField<K extends string> extends IFieldBase<K> {
  kind: "file";
}

export interface IResourceField<K extends string> extends IFieldBase<K> {
  kind: "resource";
  resourceKind: ResourceKind;
  multiple?: boolean;
  /** Compatible pulp_types offered; default from the plugin (`buildResourceFilter`). */
  pulpTypes?: string[];
}

export interface ICustomFieldProps {
  id: string;
  field: ICustomField<string>;
  value: unknown;
  onChange: (value: unknown) => void;
  isDisabled: boolean;
  ctx: IFormContext;
}

export interface ICustomField<K extends string> extends IFieldBase<K> {
  kind: "custom";
  component: React.ComponentType<ICustomFieldProps>;
  /** The empty form value (default `""`). */
  emptyValue?: unknown;
}

export type IFieldDef<K extends string = string> =
  | ISimpleField<K>
  | IChoiceField<K>
  | IStringListField<K>
  | IKeyValueField<K>
  | ISecretField<K>
  | ICodeField<K>
  | IFileField<K>
  | IResourceField<K>
  | ICustomField<K>;

export type FieldKind = IFieldDef["kind"];

/** Fields rendered side by side. */
export interface IRowDef<F extends IFieldDef = IFieldDef> {
  row: F[];
}

export type ISectionItem<F extends IFieldDef = IFieldDef> = F | IRowDef<F>;

export interface ISectionOptions {
  description?: string;
  /** Shown beside a collapsed section's title (e.g. "TLS: verify off"). */
  summary?: (ctx: IFormContext) => string | undefined;
  defaultExpanded?: FormPredicate;
  visibleWhen?: FormPredicate;
}

export interface ISectionDef<
  F extends IFieldDef = IFieldDef,
> extends ISectionOptions {
  id: string;
  title: string;
  variant: "essentials" | "collapsible";
  items: ISectionItem<F>[];
}

/** A resolved form definition, as the renderer and the derivations consume it. */
export interface IFormDef {
  title: { create: string; edit: string };
  docsUrl?: string;
  sections: ISectionDef[];
  /** Cross-field checks; returns field key → message. */
  validate?: (ctx: IFormContext) => Record<string, string> | undefined;
  /** Last step of building a body (e.g. clearing the sources a choice turned off). */
  transformBody?: (
    body: Record<string, unknown>,
    ctx: IFormContext,
  ) => Record<string, unknown>;
}
