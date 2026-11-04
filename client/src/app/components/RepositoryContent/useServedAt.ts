import {
  repositoryDistributionsPickerParams,
  useDistributionDetailQuery,
  useDistributionsListQuery,
} from "@app/queries/distributions";
import type { IServedAt } from "@plugin-sdk/ui";

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * Where a repository's content is served (`base_url`, `registry_path`), from the default
 * of its "Use this repository" distributions picker; empty strings when none serves it
 * directly.
 */
export const useServedAt = ({
  repositoryHref,
}: {
  repositoryHref: string;
}): IServedAt => {
  const { data } = useDistributionsListQuery({
    params: repositoryDistributionsPickerParams(repositoryHref),
  });
  const listed = data?.results[0];
  // The aggregate list has the content app's `base_url` and no `registry_path`; plugins
  // serving clients elsewhere (`/pypi/`, the registry) only report them on the typed detail.
  const { data: detail } = useDistributionDetailQuery({
    href: listed?.pulp_href ?? null,
  });
  const served = detail as Record<string, unknown> | undefined;

  return {
    baseUrl: asString(served?.base_url),
    registryPath: asString(served?.registry_path),
  };
};
