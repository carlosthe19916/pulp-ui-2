import * as yup from "yup";

import type { IFieldDef, IFormContext, IFormDef } from "../types";
import type { IKeyValueRow, ISecretValue } from "./codecs";
import { visibleFields } from "./visibility";

const PEM_BLOCK =
  /^-----BEGIN [A-Z0-9 ]+-----[\s\S]+-----END [A-Z0-9 ]+-----\s*$/;

export const isRequired = ({
  field,
  ctx,
}: {
  field: IFieldDef;
  ctx: IFormContext;
}): boolean =>
  field.required === true ||
  (field.required === "create" && ctx.mode === "create");

const codeSchema = (
  field: IFieldDef,
): yup.StringSchema<string | null | undefined> => {
  const schema = yup.string().nullable();
  if (field.kind !== "code") return schema;
  switch (field.language) {
    case "json":
      return schema.test(
        "json",
        `${field.label} must be valid JSON`,
        (value) => {
          if (!value?.trim()) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
      );
    case "yaml":
      return schema.test(
        "yaml",
        `${field.label} must be valid YAML`,
        async (value) => {
          if (!value?.trim()) return true;
          // Loaded on first check, so pages without YAML never fetch the parser.
          const { parse } = await import("yaml");
          try {
            parse(value);
            return true;
          } catch {
            return false;
          }
        },
      );
    case "pem":
      return schema.test(
        "pem",
        `${field.label} must be PEM-encoded (-----BEGIN … -----END …)`,
        (value) => !value?.trim() || PEM_BLOCK.test(value.trim()),
      );
  }
};

const baseSchema = ({
  field,
  required,
}: {
  field: IFieldDef;
  required: boolean;
}): yup.AnySchema => {
  const requiredMessage = `${field.label} is required`;
  switch (field.kind) {
    case "number": {
      const schema = yup
        .number()
        .transform((value: unknown, original: unknown) =>
          original === "" || original == null ? undefined : value,
        )
        .typeError(`${field.label} must be a number`)
        .nullable();
      return required ? schema.required(requiredMessage) : schema;
    }
    case "switch":
      return yup.boolean();
    case "stringList":
      return required
        ? yup.array().of(yup.string()).min(1, requiredMessage)
        : yup.array().of(yup.string());
    case "checkboxes":
      return required ? yup.array().min(1, requiredMessage) : yup.array();
    case "keyValue":
      return yup
        .array()
        .test(
          "keys",
          `Every ${field.label.toLowerCase()} entry needs a name`,
          (rows) =>
            !rows ||
            (rows as IKeyValueRow[]).every(
              (row) => row.key.trim() !== "" || row.value.trim() === "",
            ),
        );
    case "secret":
      return yup
        .mixed<ISecretValue>()
        .test(
          "required",
          requiredMessage,
          (value) =>
            !required ||
            (!!value &&
              (value.mode === "keep" ? value.isSet : value.value !== "")),
        )
        .test(
          "pem",
          `${field.label} must be PEM-encoded (-----BEGIN … -----END …)`,
          (value) =>
            field.editor !== "pem" ||
            !value?.value.trim() ||
            PEM_BLOCK.test(value.value.trim()),
        );
    case "resource":
      if (field.multiple) {
        return required ? yup.array().min(1, requiredMessage) : yup.array();
      }
      return required
        ? yup.string().nullable().required(requiredMessage)
        : yup.string().nullable();
    case "custom":
      return required ? yup.mixed().required(requiredMessage) : yup.mixed();
    case "code": {
      const schema = codeSchema(field);
      return required ? schema.required(requiredMessage) : schema;
    }
    case "url": {
      const schema = yup
        .string()
        .nullable()
        .url(`${field.label} must be a valid URL`);
      return required ? schema.required(requiredMessage) : schema;
    }
    case "select":
    case "radio":
      // Options may be booleans or numbers, not only strings.
      return yup
        .mixed()
        .test(
          "required",
          requiredMessage,
          (value) => !required || (value !== "" && value != null),
        );
    case "text":
    case "textarea": {
      const schema = yup.string().nullable();
      return required ? schema.required(requiredMessage) : schema;
    }
    default: {
      // A new field kind fails to compile here until it has a schema.
      const unhandled: never = field;
      return unhandled;
    }
  }
};

/** The schema of a form's visible fields; hidden fields aren't validated. */
export const buildFormSchema = ({
  form,
  ctx,
}: {
  form: IFormDef;
  ctx: IFormContext;
}): yup.AnyObjectSchema => {
  const shape: Record<string, yup.AnySchema> = {};
  for (const field of visibleFields({ form, ctx })) {
    const schema = baseSchema({ field, required: isRequired({ field, ctx }) });
    shape[field.key] = field.validate ? field.validate(schema) : schema;
  }
  return yup.object(shape);
};
