import { describe, expect, it } from "vitest";

import { accessKeys } from "./access";
import { accessPolicyKeys } from "./access-policies";
import { acsKeys } from "./acs";
import { ansibleCollectionKeys } from "./ansible-collections";
import { artifactKeys } from "./artifacts";
import { containerNamespaceKeys } from "./container-namespaces";
import { contentKeys } from "./content";
import { contentGuardKeys } from "./content-guards";
import { distributionKeys } from "./distributions";
import { domainKeys } from "./domains";
import { exporterKeys } from "./exporters";
import { groupKeys } from "./groups";
import { importerKeys } from "./importers";
import { mavenRepositoryKeys } from "./maven-repositories";
import { publicationKeys } from "./publications";
import { pythonRepositoryKeys } from "./python-repositories";
import { remoteKeys } from "./remotes";
import { repositoryKeys } from "./repositories";
import { roleKeys } from "./roles";
import { signingServiceKeys } from "./signing-services";
import { taskGroupKeys } from "./task-groups";
import { taskScheduleKeys } from "./task-schedules";
import { taskKeys } from "./tasks";
import { uploadKeys } from "./uploads";
import { upstreamPulpKeys } from "./upstream-pulps";
import { userKeys } from "./users";
import type { IPulpDomain } from "./utils/pulpApi";
import { vulnReportKeys } from "./vuln-reports";
import { workerKeys } from "./workers";

const domain: IPulpDomain = { enabled: false, name: "default" };
const href = "/pulp/api/v3/groups/1/";

/** True when `key` begins with every segment of `prefix` (TanStack prefix match). */
const startsWith = ({
  key,
  prefix,
}: {
  key: readonly unknown[];
  prefix: readonly unknown[];
}) => prefix.every((segment, i) => Object.is(key[i], segment));

describe("query-key factories", () => {
  describe("groupKeys", () => {
    it("nests both user-query variants under the group's users folder", () => {
      const folder = groupKeys.users(href);
      expect(
        startsWith({
          key: groupKeys.usersQuery(href, { limit: 10 }),
          prefix: folder,
        }),
      ).toBe(true);
      expect(
        startsWith({ key: groupKeys.usersAllQuery(href), prefix: folder }),
      ).toBe(true);
    });

    it("nests the role query under the group's roles folder", () => {
      const folder = groupKeys.roles(href);
      expect(
        startsWith({
          key: groupKeys.rolesQuery(href, { limit: 10 }),
          prefix: folder,
        }),
      ).toBe(true);
    });

    it("nests users/roles sub-collections under the group detail folder", () => {
      const detail = groupKeys.detail(href);
      expect(startsWith({ key: groupKeys.users(href), prefix: detail })).toBe(
        true,
      );
      expect(startsWith({ key: groupKeys.roles(href), prefix: detail })).toBe(
        true,
      );
    });

    it("does not touch the group detail when invalidating a sub-collection", () => {
      // detail is shorter than the users folder, so a users-folder invalidation
      // never matches the detail query.
      expect(
        startsWith({
          key: groupKeys.detail(href),
          prefix: groupKeys.users(href),
        }),
      ).toBe(false);
    });

    it("keeps the list query under the list folder", () => {
      expect(
        startsWith({
          key: groupKeys.listQuery(domain, { limit: 10 }),
          prefix: groupKeys.list(),
        }),
      ).toBe(true);
    });
  });

  describe("userKeys", () => {
    it("nests the role query under the user's roles folder", () => {
      const folder = userKeys.roles(href);
      expect(
        startsWith({
          key: userKeys.rolesQuery(href, { limit: 10 }),
          prefix: folder,
        }),
      ).toBe(true);
    });

    it("nests the roles sub-collection under the user detail folder", () => {
      expect(
        startsWith({
          key: userKeys.roles(href),
          prefix: userKeys.detail(href),
        }),
      ).toBe(true);
    });
  });

  describe("domainKeys", () => {
    it("keeps the list query under the list folder", () => {
      expect(
        startsWith({
          key: domainKeys.listQuery(domain, { limit: 10 }),
          prefix: domainKeys.list(),
        }),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith({
          key: domainKeys.detailQuery(href),
          prefix: domainKeys.detail(href),
        }),
      ).toBe(true);
    });
  });

  describe("taskKeys", () => {
    it("keeps the list query under the list folder", () => {
      expect(
        startsWith({
          key: taskKeys.listQuery(domain, { limit: 10 }),
          prefix: taskKeys.list(),
        }),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith({
          key: taskKeys.detailQuery(href),
          prefix: taskKeys.detail(href),
        }),
      ).toBe(true);
    });

    it("keeps the per-resource by-PRN query under the byPrn folder", () => {
      expect(
        startsWith({
          key: taskKeys.byPrnQuery(domain, "prn:file.filerepository:abc"),
          prefix: taskKeys.byPrn(),
        }),
      ).toBe(true);
    });
  });

  describe("roleKeys", () => {
    it("keeps both list-query variants under the list folder", () => {
      expect(
        startsWith({
          key: roleKeys.listQuery(domain, { limit: 10 }),
          prefix: roleKeys.list(),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: roleKeys.listAllQuery(domain, {}),
          prefix: roleKeys.list(),
        }),
      ).toBe(true);
    });
  });

  describe("contentKeys", () => {
    it("nests a fields-subset detail under the full detail", () => {
      const href = "/pulp/api/v3/content/file/files/abc/";
      expect(contentKeys.detailQuery(href)).toEqual(contentKeys.detail(href));
      expect(
        startsWith({
          key: contentKeys.detailQuery(href, ["contents"]),
          prefix: contentKeys.detail(href),
        }),
      ).toBe(true);
    });

    it("keeps typed list queries (page and fetch-all) under the list folder", () => {
      expect(
        startsWith({
          key: contentKeys.typeListQuery(domain, "file.file", { limit: 10 }),
          prefix: contentKeys.list(),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: contentKeys.typeAllListQuery(domain, "file.file", {}),
          prefix: contentKeys.list(),
        }),
      ).toBe(true);
    });
  });

  describe("repositoryKeys", () => {
    const repoHref = "/pulp/api/v3/repositories/file/file/abc/";

    it("nests the versions list under the repository detail folder", () => {
      expect(
        startsWith({
          key: repositoryKeys.versionsQuery(repoHref, { limit: 1 }),
          prefix: repositoryKeys.detail(repoHref),
        }),
      ).toBe(true);
    });

    it("nests plugin sub-resources under the repository detail folder", () => {
      expect(
        startsWith({
          key: mavenRepositoryKeys.packagesQuery(repoHref, { limit: 1 }),
          prefix: repositoryKeys.detail(repoHref),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: pythonRepositoryKeys.blocklistQuery(repoHref, { limit: 1 }),
          prefix: repositoryKeys.detail(repoHref),
        }),
      ).toBe(true);
    });
  });

  describe("remoteKeys", () => {
    const remoteHref = "/pulp/api/v3/remotes/file/file/abc/";

    it("keeps the list query under the list folder", () => {
      expect(
        startsWith({
          key: remoteKeys.listQuery(domain, { limit: 10 }),
          prefix: remoteKeys.list(),
        }),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith({
          key: remoteKeys.detailQuery(remoteHref),
          prefix: remoteKeys.detail(remoteHref),
        }),
      ).toBe(true);
    });
  });

  describe("distributionKeys", () => {
    const distHref = "/pulp/api/v3/distributions/file/file/abc/";

    it("keeps typed and untyped list queries under the list folder", () => {
      expect(
        startsWith({
          key: distributionKeys.listQuery(domain, { limit: 10 }),
          prefix: distributionKeys.list(),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: distributionKeys.listQuery(domain, { limit: 10 }, "file/file"),
          prefix: distributionKeys.list(),
        }),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith({
          key: distributionKeys.detailQuery(distHref),
          prefix: distributionKeys.detail(distHref),
        }),
      ).toBe(true);
    });
  });

  describe("publicationKeys", () => {
    const pubHref = "/pulp/api/v3/publications/file/file/abc/";

    it("keeps the list query under the list folder", () => {
      expect(
        startsWith({
          key: publicationKeys.listQuery(domain, { limit: 10 }),
          prefix: publicationKeys.list(),
        }),
      ).toBe(true);
    });

    it("keeps the detail query under the detail folder", () => {
      expect(
        startsWith({
          key: publicationKeys.detailQuery(pubHref),
          prefix: publicationKeys.detail(pubHref),
        }),
      ).toBe(true);
    });
  });

  describe("accessKeys", () => {
    const objectHref = "/pulp/api/v3/repositories/file/file/abc/";

    it("nests roles and the user's permissions under the object", () => {
      const object = accessKeys.object(objectHref);
      expect(
        startsWith({ key: accessKeys.roles(objectHref), prefix: object }),
      ).toBe(true);
      expect(
        startsWith({
          key: accessKeys.myPermissions(objectHref),
          prefix: object,
        }),
      ).toBe(true);
    });
  });

  describe("exporterKeys and importerKeys", () => {
    const exporterHref = "/pulp/api/v3/exporters/core/pulp/abc/";
    const importerHref = "/pulp/api/v3/importers/core/pulp/abc/";

    it("nests past runs under their exporter or importer", () => {
      expect(
        startsWith({
          key: exporterKeys.exports(exporterHref),
          prefix: exporterKeys.detail(exporterHref),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: importerKeys.imports(importerHref),
          prefix: importerKeys.detail(importerHref),
        }),
      ).toBe(true);
    });

    it("keeps each list query under its list folder", () => {
      expect(
        startsWith({
          key: exporterKeys.listQuery(domain, "core/pulp", {
            limit: 10,
            offset: 0,
          }),
          prefix: exporterKeys.list(),
        }),
      ).toBe(true);
      expect(
        startsWith({
          key: importerKeys.listQuery(domain, { limit: 10 }),
          prefix: importerKeys.list(),
        }),
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
        [
          signingServiceKeys.listQuery(domain, { limit: 10 }),
          signingServiceKeys.list(),
        ],
      ];
      for (const [key, folder] of pairs) {
        expect(startsWith({ key, prefix: folder })).toBe(true);
      }
    });

    it("keeps a task group's detail under the family root", () => {
      expect(
        startsWith({
          key: taskGroupKeys.detail("/pulp/api/v3/task-groups/abc/"),
          prefix: taskGroupKeys.all(),
        }),
      ).toBe(true);
    });
  });
});
