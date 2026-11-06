import type { ListPaginationState } from "@app/utils/listState";

/** Where a related unit was looked up: the drawer's version, else the whole domain. */
export const lookupScope = (versionHref?: string) =>
  versionHref ? "this repository version" : "this domain";

/** A page of related units, read by the caller and paged here. */
export interface IRelatedPaging {
  count: number;
  pagination: ListPaginationState;
  onPaginationChange: (next: ListPaginationState) => void;
}

/** Pulp records no keys for a synced package, which isn't the same as an unsigned one. */
export const embeddedKeysEmptyText = (signingKeys?: string[] | null) =>
  signingKeys ? "Unsigned package" : "No signing keys recorded";
