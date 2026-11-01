import type { IContentListParams } from "@app/queries/content";
import { getContentType } from "@catalog";

export type ContentPulpType = NonNullable<
  IContentListParams["pulp_type__in"]
>[number];

/** A content type the catalog declares; every one is in Pulp's enum, so the guard narrows to it. */
export const isContentPulpType = (value: string): value is ContentPulpType =>
  !!getContentType(value);
