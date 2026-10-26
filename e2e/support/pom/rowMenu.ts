import { type Locator } from "@playwright/test";

/**
 * Open a row's kebab (`ActionsColumn`) menu and click one of its items.
 *
 * Both clicks rely on Playwright's actionability auto-waiting; callers are
 * responsible for ensuring the list has settled first (see
 * `DataViewList.filterBy`), so the row is not mid-refetch when the menu opens.
 */
export async function clickRowMenuItem(
  row: Locator,
  item: Locator,
): Promise<void> {
  await row.getByRole("button", { name: "Kebab toggle" }).click();
  await item.click();
}
