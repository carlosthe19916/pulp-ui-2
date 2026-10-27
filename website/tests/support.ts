import type { Page, TestInfo } from "@playwright/test";

// Console noise that isn't a sign of the app being broken: external resources
// (web fonts) that may be blocked or rate-limited in CI, and the dev-only React
// DevTools hint. Anything else counts as a real error.
const IGNORED_ERROR_PATTERNS = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /Download the React DevTools/i,
];

function isIgnored(text: string): boolean {
  return IGNORED_ERROR_PATTERNS.some((pattern) => pattern.test(text));
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
    const text = message.text();
    if (isIgnored(text)) return;
    errors.push(`console.error: ${text}`);
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
