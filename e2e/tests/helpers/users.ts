import type { Locator, Page } from "@playwright/test";

import { UserDetailPage } from "../pom/UserDetailPage";
import type { PulpApi } from "./pulp-api";

// Users table columns, in order (LIST-01).
export const COL = { email: 1, active: 2, groups: 3, dateJoined: 4 } as const;

export const cell = (row: Locator, column: number): Locator =>
  row.getByRole("gridcell").nth(column);

const userId = async (api: PulpApi, username: string): Promise<number> => {
  const user = await api.user(username);
  if (!user) throw new Error(`No user ${username}`);
  return user.id;
};

export const groupId = async (api: PulpApi, name: string): Promise<number> => {
  const group = await api.group(name);
  if (!group) throw new Error(`No group ${name}`);
  return group.id;
};

/** Open the user's detail page directly. */
export const openDetail = async (
  page: Page,
  api: PulpApi,
  username: string,
): Promise<UserDetailPage> => {
  const detail = new UserDetailPage(page, username);
  await detail.goto(await userId(api, username));
  return detail;
};

/** A user with every optional field set, for edit/detail scenarios. */
export const filledUser = {
  email: "before@example.com",
  first_name: "Before",
  last_name: "Person",
  is_active: true,
  is_staff: false,
};
