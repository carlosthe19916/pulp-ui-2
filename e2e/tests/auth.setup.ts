import { test as setup } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";

const AUTH_STATE_PATH = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
