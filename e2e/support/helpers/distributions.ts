import { expect, type Page } from "@playwright/test";

import type { Cleanup } from "./cleanup";
import { idOf } from "./hrefs";
import type { PulpApi } from "./pulp-api";
import { uniqueName } from "./unique";

/** A file distribution as the API returns it (the fields the specs read). */
export interface IDistributionRecord {
  pulp_href: string;
  name: string;
  base_path: string;
  repository: string | null;
  repository_version: string | null;
  publication: string | null;
  content_guard: string | null;
}

export const DISTRIBUTIONS = "/content-management/default/distributions";

export const detailPath = (href: string): string =>
  `${DISTRIBUTIONS}/file.file/${idOf(href)}`;

export const editPath = (href: string): string => `${detailPath(href)}/edit`;

/** A base path no other test uses: tests run in parallel against one backend. */
export const uniqueBasePath = (name: string): string => `e2e/${name}`;

/** The file distribution with this exact name, if it exists yet. */
export const fileDistribution = (
  api: PulpApi,
  name: string,
): Promise<IDistributionRecord | undefined> =>
  api.findByName<IDistributionRecord>("distributions/file/file", name);

/** Seed a file repository, registered for cleanup; returns its name and href. */
export const seedRepository = async (
  api: PulpApi,
  cleanup: Cleanup,
): Promise<{ name: string; href: string }> => {
  const name = cleanup.repository(uniqueName("repo"));
  const href = await api.createRepository("file/file", { name });
  return { name, href };
};

/** Publish one version of a repository; the publication is cleaned up by href. */
export const seedPublication = async (
  api: PulpApi,
  cleanup: Cleanup,
  repositoryVersion: string,
): Promise<string> => {
  const href = await api.createViaTask("publications/file/file", {
    repository_version: repositoryVersion,
  });
  cleanup.href(href);
  return href;
};

/** Seed a file distribution through the API (it is created by a task). */
export const seedDistribution = async (
  api: PulpApi,
  cleanup: Cleanup,
  body: Record<string, unknown> = {},
): Promise<{ name: string; href: string; basePath: string }> => {
  const name = cleanup.distribution(uniqueName("dist"));
  const basePath = uniqueBasePath(name);
  const href = await api.createViaTask("distributions/file/file", {
    name,
    base_path: basePath,
    ...body,
  });
  return { name, href, basePath };
};

/** The expanded detail row of a listed distribution (it shows a "Client setup" fact). */
export const expandedRow = (page: Page) =>
  page.getByRole("row").filter({ hasText: "Client setup" });

/** Wait until the create task has made the distribution (polls the API). */
export const expectCreated = async (
  api: PulpApi,
  name: string,
): Promise<void> => {
  await expect
    .poll(async () => (await fileDistribution(api, name))?.name, {
      timeout: 30_000,
    })
    .toBe(name);
};
