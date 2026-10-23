import type { RepositoryResponse } from "@app/client";
import { parseRepositoryVersionHref } from "@app/queries/utils/pulpHref";

/** A repository's latest version number, or undefined before it's loaded. */
export const latestVersionNumber = (repository?: RepositoryResponse) =>
  repository?.latest_version_href
    ? parseRepositoryVersionHref(repository.latest_version_href)?.number
    : undefined;
