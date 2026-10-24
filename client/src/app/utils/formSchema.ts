import * as yup from "yup";

import type { IEntityField } from "@catalog";

export const getFieldValue = ({
  entity,
  key,
}: {
  entity: object;
  key: string;
}): unknown => {
  return Object.hasOwn(entity, key)
    ? Object.getOwnPropertyDescriptor(entity, key)?.value
    : undefined;
};

export const toFieldRecord = (entity: object): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(entity));
};

const buildFieldValidator = (field: IEntityField): yup.AnySchema => {
  switch (field.type) {
    case "number": {
      const schema = yup
        .number()
        .transform((value: unknown, original: unknown) =>
          original === "" || original === undefined ? undefined : value,
        )
        .nullable();
      return field.required
        ? schema.required(`${field.label} is required`)
        : schema;
    }
    case "boolean":
      return yup.boolean().nullable();
    case "file": {
      const schema = yup.mixed<File>().nullable();
      return field.required
        ? schema.required(`${field.label} is required`)
        : schema;
    }
    case "content":
      return field.required
        ? yup.array().min(1, `Select at least one ${field.label.toLowerCase()}`)
        : yup.array();
    case "json": {
      const schema = yup
        .string()
        .nullable()
        .test("json", `${field.label} must be valid JSON`, (value) => {
          if (!value) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        });
      return field.required
        ? schema.required(`${field.label} is required`)
        : schema;
    }
    case "asyncResource":
      if (field.multiple) {
        return field.required
          ? yup.array().min(1, `${field.label} is required`)
          : yup.array();
      }
      return field.required
        ? yup.string().nullable().required(`${field.label} is required`)
        : yup.string().nullable();
    case "select":
    case "stringList":
    case "textarea":
    case "text":
    default: {
      const schema = yup.string().nullable();
      return field.required
        ? schema.required(`${field.label} is required`)
        : schema;
    }
  }
};

export const buildFieldSchema = (
  fields: IEntityField[],
): yup.AnyObjectSchema => {
  const shape: Record<string, yup.AnySchema> = {};
  for (const field of fields) {
    shape[field.key] = buildFieldValidator(field);
  }
  return yup.object(shape);
};

const isListField = (field: IEntityField): boolean =>
  field.type === "content" ||
  (field.type === "asyncResource" && !!field.multiple);

const emptyValue = (field: IEntityField): unknown => {
  if (field.type === "boolean") return false;
  return isListField(field) ? [] : "";
};

/** A record's value in its form shape: lists as lines, JSON as text. */
const toFormValue = ({
  field,
  value,
}: {
  field: IEntityField;
  value: unknown;
}): unknown => {
  if (value === null) return emptyValue(field);
  if (field.type === "stringList" && Array.isArray(value)) {
    return value.join("\n");
  }
  if (field.type === "json" && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return value;
};

/** Optionally seeded from an existing record (edit forms). */
export const buildDefaultValues = ({
  fields,
  source,
}: {
  fields: IEntityField[];
  source?: object | null;
}): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const sourceValue =
      source != null
        ? getFieldValue({ entity: source, key: field.key })
        : undefined;
    if (sourceValue !== undefined) {
      values[field.key] = toFormValue({ field, value: sourceValue });
      continue;
    }
    if (field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue;
      continue;
    }
    values[field.key] = emptyValue(field);
  }
  return values;
};

/**
 * A submitted form's values as a request body: list fields become arrays (lines,
 * picked content hrefs), JSON is parsed, and empty values are dropped.
 */
export const fieldsToBody = ({
  fields,
  values,
}: {
  fields: IEntityField[];
  values: Record<string, unknown>;
}): Record<string, unknown> => {
  const body: Record<string, unknown> = { ...values };
  for (const field of fields) {
    const value = values[field.key];
    if (field.type === "stringList" && typeof value === "string") {
      const lines = value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      body[field.key] = lines.length ? lines : undefined;
    } else if (field.type === "json" && typeof value === "string" && value) {
      body[field.key] = JSON.parse(value) as unknown;
    } else if (field.type === "content" && Array.isArray(value)) {
      body[field.key] = value.length
        ? value.map((unit: { href: string }) => unit.href)
        : undefined;
    } else if (isListField(field) && Array.isArray(value) && !value.length) {
      body[field.key] = undefined;
    }
  }
  return cleanFormValues(body);
};

/** Strip empty-string/undefined/null values from a submitted form payload, leaving booleans and numbers intact. */
export const cleanFormValues = <T extends Record<string, unknown>>(
  values: Record<string, unknown>,
): T => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined || value === null) {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned as T;
};
