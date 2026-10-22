import type { Page } from "@playwright/test";

/**
 * Collect the URLs of API responses that come back 404 from now on. Use it to
 * assert a flow never requests a resource that no longer exists (e.g. a detail
 * page refetching itself right after a delete).
 */
export const recordApiNotFound = (page: Page): string[] => {
  const urls: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 404 && response.url().includes("/api/")) {
      urls.push(response.url());
    }
  });
  return urls;
};
