/**
 * A `q` filter expression for content not in `notInVersionHref`, optionally limited to
 * content in `inVersionHref`. Both must go in `q`: Pulp rejects the plain
 * `repository_version` param combined with a `q` on the same filter.
 */
export const notInVersionQuery = ({
  notInVersionHref,
  inVersionHref,
}: {
  notInVersionHref: string;
  inVersionHref?: string;
}): string => {
  const notIn = `NOT repository_version="${notInVersionHref}"`;
  return inVersionHref
    ? `repository_version="${inVersionHref}" AND ${notIn}`
    : notIn;
};
