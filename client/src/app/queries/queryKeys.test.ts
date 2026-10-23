import { describe, expect, it } from "vitest";

import { accessKeys } from "./access";
import { accessPolicyKeys } from "./access-policies";
import { acsKeys } from "./acs";
import { ansibleCollectionKeys } from "./ansible-collections";
import { artifactKeys } from "./artifacts";
import { containerNamespaceKeys } from "./container-namespaces";
import { contentKeys } from "./content";
import { contentGuardKeys } from "./content-guards";
import { exporterKeys } from "./exporters";
import { importerKeys } from "./importers";
import { distributionKeys } from "./distributions";
import { domainKeys } from "./domains";
import { groupKeys } from "./groups";
import { publicationKeys } from "./publications";
import { remoteKeys } from "./remotes";
import { repositoryKeys } from "./repositories";
import { roleKeys } from "./roles";
import { taskGroupKeys } from "./task-groups";
import { taskScheduleKeys } from "./task-schedules";
import { taskKeys } from "./tasks";
import { uploadKeys } from "./uploads";
import { upstreamPulpKeys } from "./upstream-pulps";
import { userKeys } from "./users";
import { vulnReportKeys } from "./vuln-reports";
import { workerKeys } from "./workers";
import type { IPulpDomain } from "./utils/pulpApi";

const domain: IPulpDomain = { enabled: false, name: "default" };
const href = "/pulp/api/v3/groups/1/";

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

    it("nests the role query under the group's roles folder", () => {
      const folder = groupKeys.roles(href);
      expect(
        startsWith(groupKeys.rolesQuery(href, { limit: 10 }), folder),
      ).toBe(true);
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
    it("nests the role query under the user's roles folder", () => {
      const folder = userKeys.roles(href);
      expect(startsWith(userKeys.rolesQuery(href, { limit: 10 }), folder)).toBe(
        true,
      );
    });

    it("nests the roles sub-collection under the user detail folder", () => {
      expect(startsWith(userKeys.roles(href), userKeys.detail(href))).toBe(
        true,
      );
    });
  });

  describe("domainKeys", () => {
    it("keeps the list query under the list folder", () => {
      expect(
        startsWith(
          domainKeys.listQuery(domain, { limit: 10 }),
          domainKeys.list(),
        ),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith(domainKeys.detailQuery(href), domainKeys.detail(href)),
      ).toBe(true);
    });
  });

  describe("taskKeys", () => {
    it("keeps the list query under the list folder", () => {
      expect(
        startsWith(taskKeys.listQuery(domain, { limit: 10 }), taskKeys.list()),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith(taskKeys.detailQuery(href), taskKeys.detail(href)),
      ).toBe(true);
    });

    it("keeps the per-resource by-PRN query under the byPrn folder", () => {
      expect(
        startsWith(
          taskKeys.byPrnQuery(domain, "prn:file.filerepository:abc"),
          taskKeys.byPrn(),
        ),
      ).toBe(true);
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

  describe("contentKeys", () => {
    it("keeps typed list queries (page and fetch-all) under the list folder", () => {
      expect(
        startsWith(
          contentKeys.typeListQuery(domain, "file.file", { limit: 10 }),
          contentKeys.list(),
        ),
      ).toBe(true);
      expect(
        startsWith(
          contentKeys.typeAllListQuery(domain, "file.file", {}),
          contentKeys.list(),
        ),
      ).toBe(true);
    });
  });

  describe("repositoryKeys", () => {
    const repoHref = "/pulp/api/v3/repositories/file/file/abc/";

    it("nests the versions list under the repository detail folder", () => {
      expect(
        startsWith(
          repositoryKeys.versionsQuery(repoHref, { limit: 1 }),
          repositoryKeys.detail(repoHref),
        ),
      ).toBe(true);
    });

    it("nests plugin sub-resources under the repository detail folder", () => {
      expect(
        startsWith(
          repositoryKeys.subResourceQuery(repoHref, "packages/", {}),
          repositoryKeys.detail(repoHref),
        ),
      ).toBe(true);
    });
  });

  describe("remoteKeys", () => {
    const remoteHref = "/pulp/api/v3/remotes/file/file/abc/";

    it("keeps the list query under the list folder", () => {
      expect(
        startsWith(
          remoteKeys.listQuery(domain, { limit: 10 }),
          remoteKeys.list(),
        ),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith(
          remoteKeys.detailQuery(remoteHref),
          remoteKeys.detail(remoteHref),
        ),
      ).toBe(true);
    });
  });

  describe("distributionKeys", () => {
    const distHref = "/pulp/api/v3/distributions/file/file/abc/";

    it("keeps typed and untyped list queries under the list folder", () => {
      expect(
        startsWith(
          distributionKeys.listQuery(domain, { limit: 10 }),
          distributionKeys.list(),
        ),
      ).toBe(true);
      expect(
        startsWith(
          distributionKeys.listQuery(domain, { limit: 10 }, "file/file"),
          distributionKeys.list(),
        ),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith(
          distributionKeys.detailQuery(distHref),
          distributionKeys.detail(distHref),
        ),
      ).toBe(true);
    });
  });

  describe("publicationKeys", () => {
    const pubHref = "/pulp/api/v3/publications/file/file/abc/";

    it("keeps both list-query variants under the list folder", () => {
      expect(
        startsWith(
          publicationKeys.listQuery(domain, { limit: 10 }),
          publicationKeys.list(),
        ),
      ).toBe(true);
      expect(
        startsWith(
          publicationKeys.allListQuery(domain, {}),
          publicationKeys.list(),
        ),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith(
          publicationKeys.detailQuery(pubHref),
          publicationKeys.detail(pubHref),
        ),
      ).toBe(true);
    });
  });

  describe("accessKeys", () => {
    const objectHref = "/pulp/api/v3/repositories/file/file/abc/";

    it("nests roles and the user's permissions under the object", () => {
      const object = accessKeys.object(objectHref);
      expect(startsWith(accessKeys.roles(objectHref), object)).toBe(true);
      expect(startsWith(accessKeys.myPermissions(objectHref), object)).toBe(
        true,
      );
    });
  });

  describe("exporterKeys and importerKeys", () => {
    const exporterHref = "/pulp/api/v3/exporters/core/pulp/abc/";
    const importerHref = "/pulp/api/v3/importers/core/pulp/abc/";

    it("nests past runs under their exporter or importer", () => {
      expect(
        startsWith(
          exporterKeys.exports(exporterHref),
          exporterKeys.detail(exporterHref),
        ),
      ).toBe(true);
      expect(
        startsWith(
          importerKeys.imports(importerHref),
          importerKeys.detail(importerHref),
        ),
      ).toBe(true);
    });

    it("keeps each list query under its list folder", () => {
      expect(
        startsWith(
          exporterKeys.listQuery(domain, "core/pulp", { limit: 10, offset: 0 }),
          exporterKeys.list(),
        ),
      ).toBe(true);
      expect(
        startsWith(
          importerKeys.listQuery(domain, { limit: 10 }),
          importerKeys.list(),
        ),
      ).toBe(true);
    });
  });

  describe("new list factories", () => {
    it("keep their list queries under their list folder", () => {
      const pairs: [readonly unknown[], readonly unknown[]][] = [
        [
          contentGuardKeys.listQuery(domain, { limit: 10 }),
          contentGuardKeys.list(),
        ],
        [
          acsKeys.listQuery(domain, "file/file", { limit: 10, offset: 0 }),
          acsKeys.list(),
        ],
        [
          upstreamPulpKeys.listQuery(domain, { limit: 10 }),
          upstreamPulpKeys.list(),
        ],
        [
          accessPolicyKeys.listQuery(domain, { limit: 10 }),
          accessPolicyKeys.list(),
        ],
        [
          vulnReportKeys.listQuery(domain, { limit: 10 }),
          vulnReportKeys.list(),
        ],
        [workerKeys.listQuery(domain, { limit: 10 }), workerKeys.list()],
        [
          taskScheduleKeys.listQuery(domain, { limit: 10 }),
          taskScheduleKeys.list(),
        ],
        [
          containerNamespaceKeys.listQuery(domain, { limit: 10 }),
          containerNamespaceKeys.list(),
        ],
        [
          ansibleCollectionKeys.listQuery(domain, { limit: 10 }),
          ansibleCollectionKeys.list(),
        ],
        [artifactKeys.listQuery(domain, { limit: 10 }), artifactKeys.list()],
        [uploadKeys.listQuery(domain, { limit: 10 }), uploadKeys.list()],
      ];
      for (const [key, folder] of pairs) {
        expect(startsWith(key, folder)).toBe(true);
      }
    });

    it("keeps a task group's detail under the family root", () => {
      expect(
        startsWith(
          taskGroupKeys.detail("/pulp/api/v3/task-groups/abc/"),
          taskGroupKeys.all(),
        ),
      ).toBe(true);
    });
  });
});
