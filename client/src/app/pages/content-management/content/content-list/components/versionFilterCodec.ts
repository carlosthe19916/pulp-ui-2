/**
 * Encode/decode the composite repository-version filters as a single string each, so they fit one
 * `IContentFilters` key apiece. One home for the wire format; the page decodes them into the
 * aggregate `content/` params (`repository_version[_added|_removed]`, `added_between`/`removed_between`).
 */

/** Which repository-version relation to filter on. */
export type VersionRelation = "in" | "added" | "removed";

/** Diff direction: content added / removed between two repository versions. */
export type DiffRelation = "added" | "removed";

export interface IRepositoryVersionValue {
  relation: VersionRelation;
  versionHref: string;
}

export interface IVersionDiffValue {
  relation: DiffRelation;
  baseHref: string;
  targetHref: string;
}

/** `{ relation, versionHref }` ⇄ `relation:versionHref` (empty when no version chosen). */
export const encodeRepositoryVersion = ({
  relation,
  versionHref,
}: IRepositoryVersionValue): string =>
  versionHref ? `${relation}:${versionHref}` : "";

export const decodeRepositoryVersion = (
  value: string,
): IRepositoryVersionValue => {
  const separator = value.indexOf(":");
  if (separator === -1) return { relation: "in", versionHref: "" };
  return {
    relation: value.slice(0, separator) as VersionRelation,
    versionHref: value.slice(separator + 1),
  };
};

/** `{ relation, base, target }` ⇄ `relation:base|target` (empty unless both are chosen). */
export const encodeVersionDiff = ({
  relation,
  baseHref,
  targetHref,
}: IVersionDiffValue): string =>
  baseHref && targetHref ? `${relation}:${baseHref}|${targetHref}` : "";

export const decodeVersionDiff = (value: string): IVersionDiffValue => {
  const separator = value.indexOf(":");
  if (separator === -1) {
    return { relation: "added", baseHref: "", targetHref: "" };
  }
  const relation = value.slice(0, separator) as DiffRelation;
  const [baseHref = "", targetHref = ""] = value
    .slice(separator + 1)
    .split("|");
  return { relation, baseHref, targetHref };
};
