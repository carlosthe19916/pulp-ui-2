import { expect } from "@playwright/test";

import type { PulpApi } from "./pulp-api";

/** The single publication of a repository, once its create task has finished. */
export const publicationOf = async (
  api: PulpApi,
  repositoryHref: string,
): Promise<string> => {
  await expect
    .poll(() =>
      api
        .publicationHrefsForRepository(repositoryHref)
        .then((hrefs) => hrefs.length),
    )
    .toBe(1);
  const [href] = await api.publicationHrefsForRepository(repositoryHref);
  return href;
};
