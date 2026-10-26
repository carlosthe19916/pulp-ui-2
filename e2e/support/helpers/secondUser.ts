import type { Browser, BrowserContext, Page } from "@playwright/test";

import {
  expectAuthenticated,
  type ICredentials,
  submitBasicLogin,
} from "./auth";
import type { Cleanup } from "./cleanup";
import type { ISeedUser, IUserRecord, PulpApi } from "./pulp-api";
import { STRONG_PASSWORD, uniqueName } from "./unique";

export interface ISecondUser extends ICredentials {
  record: IUserRecord;
}

/**
 * Non-admin users a test creates through the API and logs in with the basic-auth
 * form, each in its own browser context so the admin's `page` stays logged in.
 */
export class SecondUsers {
  private readonly contexts: BrowserContext[] = [];

  constructor(
    private readonly browser: Browser,
    private readonly baseURL: string | undefined,
    private readonly api: PulpApi,
    private readonly cleanup: Cleanup,
  ) {}

  async create(input: Partial<ISeedUser> = {}): Promise<ISecondUser> {
    const username = this.cleanup.user(input.username ?? uniqueName("second"));
    const password = input.password ?? STRONG_PASSWORD;
    const record = await this.api.createUser({ ...input, username, password });
    return { username, password, record };
  }

  /** Log in and wait for the dashboard. */
  async login(user: ICredentials): Promise<Page> {
    const page = await this.attemptLogin(user);
    await expectAuthenticated(page);
    return page;
  }

  /** Submit the login form without asserting the outcome. */
  async attemptLogin(user: ICredentials): Promise<Page> {
    const context = await this.browser.newContext({ baseURL: this.baseURL });
    this.contexts.push(context);
    const page = await context.newPage();
    await submitBasicLogin(page, user);
    return page;
  }

  async close(): Promise<void> {
    for (const context of this.contexts) await context.close();
  }
}
