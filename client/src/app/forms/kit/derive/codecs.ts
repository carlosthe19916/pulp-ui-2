import type { FieldKind, FormMode, IFieldDef } from "../types";

/** A write-only field's form value: keep what the server has, replace it or clear it. */
export interface ISecretValue {
  mode: "keep" | "replace" | "clear";
  value: string;
  /** Whether the server reported it set (`hidden_fields[].is_set`). */
  isSet: boolean;
}

export interface IKeyValueRow {
  /** Stable React key; never sent. */
  id: string;
  key: string;
  value: string;
}

export const newKeyValueRow = ({
  key = "",
  value = "",
}: { key?: string; value?: string } = {}): IKeyValueRow => ({
  id: crypto.randomUUID(),
  key,
  value,
});

/** Converts one field kind between its API value and its form value. */
interface ICodec {
  empty: (field: IFieldDef) => unknown;
  /** `entity` is the whole edited object (a secret reads its `hidden_fields`). */
  fromApi: (
    value: unknown,
    field: IFieldDef,
    entity: Record<string, unknown>,
  ) => unknown;
  /** `undefined` means "empty": dropped on create, cleared on edit. */
  toApi: (value: unknown, field: IFieldDef) => unknown;
  /** Edit value for an emptied field. */
  clearAs: unknown;
}

const text: ICodec = {
  empty: () => "",
  fromApi: (value) => (value == null ? "" : String(value)),
  toApi: (value) =>
    typeof value === "string" && value.trim() !== "" ? value : undefined,
  clearAs: null,
};

const number: ICodec = {
  empty: () => "",
  fromApi: (value) => (value == null ? "" : String(value)),
  toApi: (value) => {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  },
  clearAs: null,
};

const boolean: ICodec = {
  empty: () => false,
  fromApi: (value) => value === true,
  toApi: (value) => value === true,
  clearAs: false,
};

const choice: ICodec = {
  empty: () => "",
  fromApi: (value) => value ?? "",
  toApi: (value) => (value === "" || value == null ? undefined : value),
  clearAs: null,
};

const stringList: ICodec = {
  empty: () => [],
  fromApi: (value) =>
    Array.isArray(value) ? value.map((item) => String(item)) : [],
  toApi: (value) =>
    Array.isArray(value) && value.length > 0 ? value : undefined,
  clearAs: null,
};

// Enum lists (e.g. Python package types) aren't nullable: an empty list clears them.
const checkboxes: ICodec = {
  empty: () => [],
  fromApi: (value) => (Array.isArray(value) ? value : []),
  toApi: (value) =>
    Array.isArray(value) && value.length > 0 ? value : undefined,
  clearAs: [],
};

const toRows = (value: unknown, field: IFieldDef): IKeyValueRow[] => {
  if (field.kind !== "keyValue" || value == null) return [];
  if (field.shape === "headers" && Array.isArray(value)) {
    // Pulp headers: `[{ "Header-Name": "value" }, …]`.
    return value.flatMap((entry) =>
      entry && typeof entry === "object"
        ? Object.entries(entry).map(([key, item]) =>
            newKeyValueRow({ key, value: String(item) }),
          )
        : [],
    );
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, item]) =>
      newKeyValueRow({ key, value: String(item) }),
    );
  }
  return [];
};

const keyValue: ICodec = {
  empty: () => [],
  fromApi: toRows,
  toApi: (value, field) => {
    const rows = (Array.isArray(value) ? (value as IKeyValueRow[]) : []).filter(
      (row) => row.key.trim() !== "",
    );
    if (rows.length === 0) return undefined;
    return field.kind === "keyValue" && field.shape === "headers"
      ? rows.map((row) => ({ [row.key.trim()]: row.value }))
      : Object.fromEntries(rows.map((row) => [row.key.trim(), row.value]));
  },
  clearAs: [],
};

const json: ICodec = {
  empty: () => "",
  fromApi: (value) =>
    value == null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2),
  toApi: (value) => {
    if (typeof value !== "string" || value.trim() === "") return undefined;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      // The schema rejects invalid JSON before a body is built.
      return undefined;
    }
  },
  clearAs: null,
};

const secret: ICodec = {
  empty: () =>
    ({ mode: "replace", value: "", isSet: false }) satisfies ISecretValue,
  // Write-only: the API never returns the value, only whether it is set.
  fromApi: (_value, field, entity) => {
    const hidden = entity.hidden_fields;
    const isSet =
      Array.isArray(hidden) &&
      hidden.some(
        (item: { name?: string; is_set?: boolean }) =>
          item.name === field.key && item.is_set === true,
      );
    return { mode: "keep", value: "", isSet } satisfies ISecretValue;
  },
  toApi: (value) => {
    const secretValue = value as ISecretValue | undefined;
    if (!secretValue || secretValue.mode === "keep") return undefined;
    if (secretValue.mode === "clear") return null;
    return secretValue.value === "" ? undefined : secretValue.value;
  },
  clearAs: null,
};

const resource: ICodec = {
  empty: (field) => (field.kind === "resource" && field.multiple ? [] : ""),
  fromApi: (value, field) =>
    field.kind === "resource" && field.multiple
      ? Array.isArray(value)
        ? value
        : []
      : (value ?? ""),
  toApi: (value) =>
    value === "" || value == null || (Array.isArray(value) && !value.length)
      ? undefined
      : value,
  clearAs: null,
};

const custom: ICodec = {
  empty: () => "",
  fromApi: (value) => value ?? "",
  toApi: (value) => (value === "" || value == null ? undefined : value),
  clearAs: null,
};

const CODECS: Record<FieldKind, ICodec> = {
  text,
  url: text,
  textarea: text,
  number,
  switch: boolean,
  select: choice,
  radio: choice,
  stringList,
  checkboxes,
  keyValue,
  secret,
  code: text,
  resource,
  custom,
};

const codecOf = (field: IFieldDef): ICodec =>
  field.kind === "code" && field.language === "json"
    ? json
    : CODECS[field.kind];

/** The form value of an untouched field. */
export const emptyValue = (field: IFieldDef): unknown =>
  codecOf(field).empty(field);

/** The form value of a field read from the edited object. */
export const fromApiValue = ({
  field,
  entity,
}: {
  field: IFieldDef;
  entity: Record<string, unknown>;
}): unknown => {
  if (field.fromEntity) return field.fromEntity(entity);
  return codecOf(field).fromApi(entity[field.key], field, entity);
};

/** The body value of a form value; `undefined` when the field is empty. */
export const toApiValue = ({
  field,
  value,
}: {
  field: IFieldDef;
  value: unknown;
}): unknown => codecOf(field).toApi(value, field);

/** What an edit sends to clear a field the user emptied. */
export const clearValue = (field: IFieldDef): unknown => codecOf(field).clearAs;

/** Whether a form value counts as set: opens its section on edit, feeds the summary. */
export const isValueSet = ({
  field,
  value,
}: {
  field: IFieldDef;
  value: unknown;
}): boolean => {
  if (field.kind === "secret") {
    const secretValue = value as ISecretValue | undefined;
    return !!secretValue && (secretValue.isSet || secretValue.value !== "");
  }
  if (field.kind === "switch") {
    return value !== (field.defaultValue ?? false);
  }
  const apiValue = codecOf(field).toApi(value, field);
  return apiValue !== undefined;
};

/** Whether a field is offered on a form of `mode`. */
export const isAvailableIn = ({
  field,
  mode,
}: {
  field: IFieldDef;
  mode: FormMode;
}): boolean => {
  return field.availability !== "createOnly" || mode === "create";
};
