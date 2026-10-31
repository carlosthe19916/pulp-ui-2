import type { IFieldBuilders } from "../kit/defineForm";

/**
 * Labels on create only: an existing object's labels change through `set_label/` and
 * `unset_label/`, from its detail page.
 */
export const labelsField = <T extends { pulp_labels?: unknown }>(
  f: IFieldBuilders<T>,
) =>
  f.keyValue("pulp_labels", {
    label: "Label",
    shape: "labels",
    availability: "createOnly",
  });
