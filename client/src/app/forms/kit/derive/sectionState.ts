import type { IFormContext, IFormDef, ISectionDef } from "../types";
import { isValueSet } from "./codecs";
import { isFieldVisible, sectionFields } from "./visibility";

/** The visible fields of a section that hold a value. */
const setFields = ({
  section,
  ctx,
}: {
  section: ISectionDef;
  ctx: IFormContext;
}) =>
  sectionFields(section).filter(
    (field) =>
      isFieldVisible({ field, ctx }) &&
      isValueSet({ field, value: ctx.values[field.key] }),
  );

/**
 * Sections open when the page loads: essentials always, a collapsible one when it asks to
 * or, on edit, when one of its fields already holds a value.
 */
export const initialExpandedSections = ({
  form,
  ctx,
}: {
  form: IFormDef;
  ctx: IFormContext;
}): Set<string> =>
  new Set(
    form.sections
      .filter(
        (section) =>
          section.variant === "essentials" ||
          (section.defaultExpanded?.(ctx) ?? false) ||
          (ctx.mode === "edit" && setFields({ section, ctx }).length > 0),
      )
      .map((section) => section.id),
  );

/** Sections holding at least one of `errorKeys`: opened after a failed submit. */
export const sectionsWithErrors = ({
  form,
  errorKeys,
}: {
  form: IFormDef;
  errorKeys: string[];
}): string[] =>
  form.sections
    .filter((section) =>
      sectionFields(section).some((field) => errorKeys.includes(field.key)),
    )
    .map((section) => section.id);

/** A collapsed section's summary: its own, else how many of its fields are set. */
export const sectionSummary = ({
  section,
  ctx,
}: {
  section: ISectionDef;
  ctx: IFormContext;
}): string | undefined => {
  if (section.summary) return section.summary(ctx);
  const count = setFields({ section, ctx }).length;
  return count > 0 ? `${count} set` : undefined;
};
