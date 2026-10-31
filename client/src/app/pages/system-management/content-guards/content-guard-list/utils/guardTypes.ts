import { resolveContentGuardType } from "@app/queries/utils/pulpHref";
import { getContentGuardTypes, type IGuardType } from "@plugins";

/** A guard's type with its UI, from its href (`…/contentguards/<app>/<slug>/<id>/`). */
export const guardTypeOf = (href: string): IGuardType | undefined => {
  const pulpType = resolveContentGuardType(href)?.pulpType;
  return getContentGuardTypes().find((type) => type.pulpType === pulpType);
};
