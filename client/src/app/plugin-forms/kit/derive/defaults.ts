import type { FormMode, FormValues, IFormDef } from "../types";
import { emptyValue, fromApiValue } from "./codecs";
import { formFields } from "./visibility";

/**
 * Initial form values: the edited object's values on edit, else each field's default, else
 * empty. Every field gets a value so hidden fields that later show start controlled.
 */
export const buildDefaultValues = ({
  form,
  mode,
  entity,
}: {
  form: IFormDef;
  mode: FormMode;
  entity?: Record<string, unknown>;
}): FormValues => {
  const values: FormValues = {};
  for (const field of formFields(form)) {
    if (mode === "edit" && entity) {
      values[field.key] = fromApiValue({ field, entity });
    } else if (field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue;
    } else {
      values[field.key] = emptyValue(field);
    }
  }
  return values;
};
