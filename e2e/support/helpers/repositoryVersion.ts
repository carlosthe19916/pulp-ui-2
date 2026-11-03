import { expect } from "@playwright/test";

import type { PulpApi } from "./pulp-api";

/**
 * Waits until a content change has made the repository's latest version `version`, read
 * from Pulp: the UI reports the outcome in the task drawer, not in a toast. Pass a larger
 * `timeout` for a flow that waits on two tasks (e.g. create then modify).
 */
export async function expectLatestVersion({
  api,
  repositoryName,
  version,
  timeout = 15_000,
}: {
  api: PulpApi;
  repositoryName: string;
  version: number;
  timeout?: number;
}): Promise<void> {
  await expect
    .poll(
      async () => {
        const repository = await api.findByName<{ pulp_href: string }>(
          "repositories",
          repositoryName,
        );
        return repository
          ? api.latestVersionNumber(repository.pulp_href)
          : undefined;
      },
      { timeout },
    )
    .toBe(version);
}
