import type { Page } from "@playwright/test";

/**
 * Hold the matching real requests until `release()`, to observe loading states,
 * spinners and double-submit guards. Requests reach the real backend unchanged;
 * nothing is faked.
 */
export async function delayApi(
  page: Page,
  {
    url,
    method,
  }: { url: string | RegExp | ((url: URL) => boolean); method?: string },
): Promise<{ release: () => void; held: () => number }> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let count = 0;
  await page.route(url, async (route) => {
    if (method && route.request().method() !== method) {
      await route.fallback();
      return;
    }
    count++;
    await released;
    await route.continue();
  });
  return { release, held: () => count };
}
