import {
  repositoryDistributionsPickerParams,
  useDistributionDetailQuery,
  useDistributionsListQuery,
} from "@app/queries/distributions";

import type { IServedAt } from "./browseTypes";

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
  // `registry_path` is only on the typed detail; the aggregate list omits it.
  const { data: detail } = useDistributionDetailQuery({
    href: listed?.pulp_href ?? null,
  });

  return {
    baseUrl: asString(
      (listed as Record<string, unknown> | undefined)?.base_url,
    ),
    registryPath: asString(
      (detail as Record<string, unknown> | undefined)?.registry_path,
    ),
  };
};
