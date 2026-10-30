import type { FormValues, IFieldDef, IFormContext, IFormDef } from "../types";
import { clearValue, type ISecretValue, toApiValue } from "./codecs";
import {
  isFieldVisible,
  isSectionVisible,
  sectionFields,
  visibleFields,
} from "./visibility";

const isVirtual = (field: IFieldDef): boolean => field.key.startsWith("$");

const isSame = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** A create body: the visible, non-empty values (empty ones keep the server default). */
export const buildCreateBody = ({
  form,
  values,
}: {
  form: IFormDef;
  values: FormValues;
}): Record<string, unknown> => {
  const ctx: IFormContext = { mode: "create", values };
  const body: Record<string, unknown> = {};
  for (const field of visibleFields({ form, ctx })) {
    if (isVirtual(field)) continue;
    const value = toApiValue({ field, value: values[field.key], values });
    if (value !== undefined) body[field.key] = value;
  }
  return form.transformBody ? form.transformBody(body, ctx) : body;
};

/**
 * An edit body: only the fields the user changed. An emptied field sends its clear value,
 * and a field that was set but is now hidden is cleared too; read-only and create-only
 * fields are never sent.
 */
export const buildPatchBody = ({
  form,
  values,
  initialValues,
  entity,
}: {
  form: IFormDef;
  values: FormValues;
  initialValues: FormValues;
  entity?: Record<string, unknown>;
}): Record<string, unknown> => {
  const ctx: IFormContext = { mode: "edit", values, entity };
  const initialCtx: IFormContext = {
    mode: "edit",
    values: initialValues,
    entity,
  };
  const body: Record<string, unknown> = {};
  for (const section of form.sections) {
    const sectionVisible = isSectionVisible({ section, ctx });
    for (const field of sectionFields(section)) {
      if (isVirtual(field)) continue;
      if (
        field.availability === "createOnly" ||
        field.availability === "readOnlyOnEdit"
      ) {
        continue;
      }
      const before = toApiValue({
        field,
        value: initialValues[field.key],
        values: initialValues,
      });
      if (!sectionVisible || !isFieldVisible({ field, ctx })) {
        const wasVisible =
          isSectionVisible({ section, ctx: initialCtx }) &&
          isFieldVisible({ field, ctx: initialCtx });
        // A kept secret has no body value; the server says whether it is set.
        const wasSet =
          field.kind === "secret"
            ? (initialValues[field.key] as ISecretValue | undefined)?.isSet ===
              true
            : before !== undefined;
        if (wasVisible && wasSet) {
          body[field.key] = clearValue(field);
        }
        continue;
      }
      const after = toApiValue({ field, value: values[field.key], values });
      if (field.kind === "secret") {
        // A secret starts as "keep" (no body value): anything else is a change.
        if (after !== undefined) body[field.key] = after;
        continue;
      }
      if (isSame(before, after)) continue;
      body[field.key] = after === undefined ? clearValue(field) : after;
    }
  }
  return form.transformBody ? form.transformBody(body, ctx) : body;
};
