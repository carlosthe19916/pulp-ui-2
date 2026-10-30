import type { FormValues, IFormDef } from "../types";
import { formFields } from "./visibility";

/**
 * Values to keep when the create page switches type: those whose key exists in both forms
 * with the same kind (name, URL, credentials…). Plugin-only values are dropped.
 */
export const carryOverValues = ({
  from,
  to,
  values,
}: {
  from: IFormDef;
  to: IFormDef;
  values: FormValues;
}): FormValues => {
  const fromKinds = new Map(
    formFields(from).map((field) => [field.key, field.kind]),
  );
  const carried: FormValues = {};
  for (const field of formFields(to)) {
    if (fromKinds.get(field.key) === field.kind && field.key in values) {
      carried[field.key] = values[field.key];
    }
  }
  return carried;
};
