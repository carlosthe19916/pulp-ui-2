import type { ConsoleMessage, Page, TestInfo } from "@playwright/test";

// External resources whose load failures aren't a sign of the app being broken:
// web fonts may be blocked or rate-limited in CI. Matched by exact host (parsed
// from the resource URL), so a lookalike host such as
// "fonts.googleapis.com.evil.test" is never silently ignored.
const IGNORED_ERROR_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
]);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** True for `console.error`s that come from a known-ignorable external host. */
export function isIgnoredConsoleError(message: ConsoleMessage): boolean {
  const host = hostnameOf(message.location()?.url ?? "");
  return host !== null && IGNORED_ERROR_HOSTS.has(host);
}

/**
 * Wait until Docusaurus has hydrated. Interactive widgets (the color-mode
 * toggle, mobile menu) only respond to clicks once React has attached its
 * handlers, which happens after the `load` event `page.goto` waits for.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.locator('html[data-has-hydrated="true"]').waitFor();
}

/**
 * Collect page-level errors and `console.error` output for the lifetime of a
 * test. Returns a live array; assert it is empty after navigation.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (isIgnoredConsoleError(message)) return;
    errors.push(`console.error: ${message.text()}`);
  });

  return errors;
}

/** Attach collected errors to the test report so CI failures are diagnosable. */
export async function attachErrors(
  testInfo: TestInfo,
  errors: string[],
): Promise<void> {
  if (errors.length > 0) {
    await testInfo.attach("page-errors", {
      body: errors.join("\n"),
      contentType: "text/plain",
    });
  }
}
