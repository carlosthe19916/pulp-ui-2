import { expect, type Page } from "@playwright/test";

import type { PulpApi } from "./pulp-api";

/** Open a typeahead picker (`AsyncResourceSelect`, `VersionSelect`), filter it and pick an option. */
export const pickOption = async (
  page: Page,
  { label, option }: { label: string; option: string },
): Promise<void> => {
  await page.getByRole("button", { name: label, exact: true }).click();
  const filter = page.getByLabel(`${label} filter`);
  if ((await filter.count()) > 0) await filter.fill(option);
  await page.getByRole("option", { name: option, exact: true }).click();
};

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

/** The id shown in a publication's row ("Publication <id>"). */
export const publicationId = (href: string): string =>
  href.split("/").filter(Boolean).pop() ?? "";
