import type {
  IFieldDef,
  IFormContext,
  IFormDef,
  ISectionDef,
  ISectionItem,
} from "../types";
import { isAvailableIn } from "./codecs";

const isRow = (item: ISectionItem): item is { row: IFieldDef[] } =>
  "row" in item;

/** A section's fields, rows flattened. */
export const sectionFields = (section: ISectionDef): IFieldDef[] =>
  section.items.flatMap((item) => (isRow(item) ? item.row : [item]));

/** Every field of a form, in order. */
export const formFields = (form: IFormDef): IFieldDef[] =>
  form.sections.flatMap(sectionFields);

export const isSectionVisible = ({
  section,
  ctx,
}: {
  section: ISectionDef;
  ctx: IFormContext;
}): boolean => section.visibleWhen?.(ctx) ?? true;

/** Offered in this mode and not hidden by its own or its section's condition. */
export const isFieldVisible = ({
  field,
  ctx,
}: {
  field: IFieldDef;
  ctx: IFormContext;
}): boolean =>
  isAvailableIn({ field, mode: ctx.mode }) &&
  (field.visibleWhen?.(ctx) ?? true);

/** The fields a submit validates and sends: visible ones in visible sections. */
export const visibleFields = ({
  form,
  ctx,
}: {
  form: IFormDef;
  ctx: IFormContext;
}): IFieldDef[] =>
  form.sections
    .filter((section) => isSectionVisible({ section, ctx }))
    .flatMap(sectionFields)
    .filter((field) => isFieldVisible({ field, ctx }));

export const isReadOnly = ({
  field,
  ctx,
}: {
  field: IFieldDef;
  ctx: IFormContext;
}): boolean =>
  (ctx.mode === "edit" && field.availability === "readOnlyOnEdit") ||
  (field.disabledWhen?.(ctx) ?? false);
