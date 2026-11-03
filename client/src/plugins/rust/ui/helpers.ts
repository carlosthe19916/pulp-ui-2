/** pulp_rust routes the index as `<slug:repo>`, so a base path with `/` or dots can't be served. */
const SLUG = /^[-a-zA-Z0-9_]+$/;

/**
 * Cargo's sparse index for a distribution. Pulp serves it from the API app at
 * `/pulp/cargo/<domain>/<base_path>/`, the same tail as the content URL; `null` when the
 * base path isn't a slug or the content URL doesn't use Pulp's default `/pulp/content/` prefix.
 */
export const cargoIndexUrl = ({
  baseUrl,
  basePath,
}: {
  baseUrl: string;
  basePath: string;
}): string | null =>
  SLUG.test(basePath) && baseUrl.includes("/pulp/content/")
    ? `sparse+${baseUrl.replace("/pulp/content/", "/pulp/cargo/")}`
    : null;

/** A Cargo registry name (letters, digits, `-`, `_`, starting with a letter) for a distribution. */
export const cargoRegistryName = (name: string): string => {
  const slug = name.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return /^[A-Za-z]/.test(slug) ? slug : `pulp-${slug}`;
};

/** The `.cargo/config.toml` entry that registers a distribution as a named registry. */
export const cargoRegistryConfig = ({
  name,
  indexUrl,
}: {
  name: string;
  indexUrl: string;
}) => `[registries.${cargoRegistryName(name)}]\nindex = "${indexUrl}"`;

/** One dependency as Cargo describes it: requirement, plus kind and target when not plain. */
export const cargoDependencyLabel = (dep: {
  name: string;
  req: string;
  kind?: string | null;
  target?: string | null;
}): string =>
  [
    `${dep.name} ${dep.req}`,
    dep.kind && dep.kind !== "normal" ? `(${dep.kind})` : "",
    dep.target ? `[${dep.target}]` : "",
  ]
    .filter(Boolean)
    .join(" ");
