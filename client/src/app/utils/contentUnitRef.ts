import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import type { IContentUnit } from "@app/utils/contentUnit";

/** A generic content record as a selectable unit, named by its PRN. */
export const contentUnitRef = (unit: IContentUnit): IContentUnitRef => {
  const href = unit.pulp_href ?? "";
  return {
    href,
    label: unit.prn ?? href,
    pulpType: resolvePulpType(href),
  };
};
