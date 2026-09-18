import { describe, expect, it } from "vitest";

import { groupKeys } from "./groups";
import { roleKeys } from "./roles";
import { userKeys } from "./users";
import type { IPulpDomain } from "./utils/pulpApi";

const domain: IPulpDomain = { enabled: false, name: "default" };
const href = "/api/pulp/api/v3/groups/1/";

/** True when `key` begins with every segment of `prefix` (TanStack prefix match). */
const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((segment, i) => Object.is(key[i], segment));

describe("query-key factories", () => {
  describe("groupKeys", () => {
    it("nests both user-query variants under the group's users folder", () => {
      const folder = groupKeys.users(href);
      expect(
        startsWith(groupKeys.usersQuery(href, { limit: 10 }), folder),
      ).toBe(true);
      expect(startsWith(groupKeys.usersAllQuery(href), folder)).toBe(true);
    });

    it("nests both role-query variants under the group's roles folder", () => {
      const folder = groupKeys.roles(href);
      expect(
        startsWith(groupKeys.rolesQuery(href, { limit: 10 }), folder),
      ).toBe(true);
      expect(startsWith(groupKeys.rolesAllQuery(href), folder)).toBe(true);
    });

    it("nests users/roles sub-collections under the group detail folder", () => {
      const detail = groupKeys.detail(href);
      expect(startsWith(groupKeys.users(href), detail)).toBe(true);
      expect(startsWith(groupKeys.roles(href), detail)).toBe(true);
    });

    it("does not touch the group detail when invalidating a sub-collection", () => {
      // detail is shorter than the users folder, so a users-folder invalidation
      // never matches the detail query.
      expect(startsWith(groupKeys.detail(href), groupKeys.users(href))).toBe(
        false,
      );
    });

    it("keeps the list query under the list folder", () => {
      expect(
        startsWith(
          groupKeys.listQuery(domain, { limit: 10 }),
          groupKeys.list(),
        ),
      ).toBe(true);
    });
  });

  describe("userKeys", () => {
    it("nests both role-query variants under the user's roles folder", () => {
      const folder = userKeys.roles(href);
      expect(startsWith(userKeys.rolesQuery(href, { limit: 10 }), folder)).toBe(
        true,
      );
      expect(startsWith(userKeys.rolesAllQuery(href, {}), folder)).toBe(true);
    });

    it("nests the roles sub-collection under the user detail folder", () => {
      expect(startsWith(userKeys.roles(href), userKeys.detail(href))).toBe(
        true,
      );
    });
  });

  describe("roleKeys", () => {
    it("keeps both list-query variants under the list folder", () => {
      expect(
        startsWith(roleKeys.listQuery(domain, { limit: 10 }), roleKeys.list()),
      ).toBe(true);
      expect(
        startsWith(roleKeys.listAllQuery(domain, {}), roleKeys.list()),
      ).toBe(true);
    });
  });
});
