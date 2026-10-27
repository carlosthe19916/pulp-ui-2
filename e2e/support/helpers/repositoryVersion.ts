import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Asserts the "Version N created" outcome toast after a content change.
 *
 * The UI only surfaces it once its task poll (every DEFAULT_REFETCH_INTERVAL = 5s)
 * observes the dispatched change finishing, so the toast can lag the action by nearly a
 * full poll cycle. Waiting a whole cycle past the 5s default — rather than racing the
 * poll with the default expect timeout — is what keeps these assertions stable on a
 * slower CI backend. Pass a larger `timeout` for a flow that waits on two tasks
 * (e.g. create then modify).
 */
export async function expectVersionCreated(
  page: Page,
  name: string,
  version: number,
  timeout = 15_000,
): Promise<void> {
  await expect(
    page.getByText(`Version ${version} of "${name}" created`),
  ).toBeVisible({ timeout });
}
