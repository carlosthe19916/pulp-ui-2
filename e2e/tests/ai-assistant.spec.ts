import { expect, test } from "@support/fixtures";

// Without an LLM provider the UI has no assistant and never loads its code.
test("shows no AI assistant when no LLM provider is configured", async ({
  page,
}) => {
  const assistantRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("copilotkit") || url.includes("/src/ai/")) {
      assistantRequests.push(url);
    }
  });

  await page.goto("/");
  const env = await page.evaluate(
    () => (window as unknown as { _env: string })._env,
  );
  test.skip(atob(env).includes('"AI_ENABLED":"true"'), "AI is configured here");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Pulp assistant/ }),
  ).toHaveCount(0);
  expect(assistantRequests).toEqual([]);
});
