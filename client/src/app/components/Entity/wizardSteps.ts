import type { IEntityField } from "@catalog";

const CATCH_ALL_GROUP = "Options";

export interface IFieldGroup {
  group: string;
  fields: IEntityField[];
}

/** Split fields into ordered groups (first-appearance order); ungrouped last. */
export const groupFields = (fields: IEntityField[]): IFieldGroup[] => {
  const order: string[] = [];
  const byGroup = new Map<string, IEntityField[]>();
  for (const field of fields) {
    const group = field.group ?? CATCH_ALL_GROUP;
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
      order.push(group);
    }
    byGroup.get(group)?.push(field);
  }
  return order.map((group) => ({ group, fields: byGroup.get(group) ?? [] }));
};

export const slugifyGroup = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
