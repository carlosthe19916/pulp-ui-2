/**
 * A `q` expression for content not in `notInVersionHref`, optionally limited to content
 * in `inVersionHref`.
 */
export const notInVersionQuery = ({
  notInVersionHref,
  inVersionHref,
}: {
  notInVersionHref: string;
  inVersionHref?: string;
}): string => {
  // Both go in `q`: Pulp rejects a plain `repository_version` param combined with `q`.
  const notIn = `NOT repository_version="${notInVersionHref}"`;
  return inVersionHref
    ? `repository_version="${inVersionHref}" AND ${notIn}`
    : notIn;
};
