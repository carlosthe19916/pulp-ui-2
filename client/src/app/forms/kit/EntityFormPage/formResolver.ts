import type { Resolver } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";

import { buildFormSchema } from "../derive/schema";
import type { FormMode, FormValues, IFormDef } from "../types";

/**
 * Validates against the schema of what is visible now (hidden fields are skipped), then
 * merges the definition's cross-field checks.
 */
export const formResolver =
  ({
    form,
    mode,
    entity,
  }: {
    form: IFormDef;
    mode: FormMode;
    entity?: Record<string, unknown>;
  }): Resolver<FormValues> =>
  async (values, context, options) => {
    const ctx = { mode, values, entity };
    const result = await yupResolver(buildFormSchema({ form, ctx }))(
      values,
      context,
      options,
    );
    const crossField = form.validate?.(ctx);
    if (!crossField || Object.keys(crossField).length === 0) return result;
    return {
      values: {},
      errors: {
        ...result.errors,
        ...Object.fromEntries(
          Object.entries(crossField).map(([key, message]) => [
            key,
            { type: "validate", message },
          ]),
        ),
      },
    };
  };
