import { resolveContentGuardType } from "@catalog";
import { getContentGuardTypes, type IGuardType } from "@plugins";

/** A guard's type, from its href (`…/contentguards/<app>/<slug>/<id>/`). */
export const guardTypeOf = (href: string): IGuardType | undefined => {
  const pulpType = resolveContentGuardType(href)?.pulpType;
  return getContentGuardTypes().find((type) => type.pulpType === pulpType);
};

/** Whether a guard exposes per-object role endpoints (certguard's don't; probing them 404s). */
export const guardHasRoleEndpoints = (
  href: string | null | undefined,
): boolean => !!href && !!resolveContentGuardType(href)?.rolesManaged;
