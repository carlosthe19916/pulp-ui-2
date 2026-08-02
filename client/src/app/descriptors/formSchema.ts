import * as yup from "yup";

import type { FieldDescriptor } from "./types";

/** Build a yup validator for a single field descriptor. */
function buildFieldValidator(field: FieldDescriptor): yup.AnySchema {
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
    case "select":
    case "resource":
    case "textarea":
    case "text":
    default: {
      const schema = yup.string().nullable();
      return field.required
        ? schema.required(`${field.label} is required`)
        : schema;
    }
  }
}

/** Build a yup object schema mirroring the shape of the given field descriptors. */
export function buildFieldSchema(
  fields: FieldDescriptor[],
): yup.ObjectSchema<Record<string, unknown>> {
  const shape: Record<string, yup.AnySchema> = {};
  for (const field of fields) {
    shape[field.key] = buildFieldValidator(field);
  }
  return yup.object(shape) as unknown as yup.ObjectSchema<
    Record<string, unknown>
  >;
}

/** Build default form values for the given field descriptors, optionally seeded from an existing record (for edit forms). */
export function buildDefaultValues(
  fields: FieldDescriptor[],
  source?: Record<string, unknown> | null,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const sourceValue = source?.[field.key];
    if (sourceValue !== undefined) {
      values[field.key] =
        sourceValue ?? (field.type === "boolean" ? false : "");
      continue;
    }
    if (field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue;
      continue;
    }
    values[field.key] = field.type === "boolean" ? false : "";
  }
  return values;
}

/** Strip empty-string/undefined/null values from a submitted form payload, leaving booleans and numbers intact. */
export function cleanFormValues<T extends Record<string, unknown>>(
  values: Record<string, unknown>,
): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined || value === null) {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned as T;
}
