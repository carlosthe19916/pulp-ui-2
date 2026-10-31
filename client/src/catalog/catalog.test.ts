import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";

import { buildCatalog } from "./compose";
import {
  getAvailablePlugins,
  getContentType,
  getContentTypes,
  getPlugin,
  getRepositoryContentTypes,
  getRepositoryTypesForContent,
  getRepositoryTypesForPublication,
  resolveContentTypeByApiPath,
  resolvePulpTypeByApiPath,
} from "./index";
import type { IPluginDefinition } from "./types";

/** Locks the resolved catalog so it can't silently drift. */
describe("catalog composition", () => {
  it("carries each repository's valid sync remote types (backend REMOTE_TYPES)", () => {
    // rpm and file both accept a second remote variant (ULN, Git).
    expect(
      getPlugin("rpm.rpm")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["rpm.rpm", "rpm.uln"]);
    expect(
      getPlugin("file.file")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["file.file", "file.git"]);
    expect(
      getPlugin("python.python")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["python.python"]);
    // A container repo syncs only from container.container — NOT its pull-through
    // remote variant, which the backend's REMOTE_TYPES excludes.
    expect(
      getPlugin("container.container")?.entities.repository
        ?.compatibleRemoteTypes,
    ).toEqual(["container.container"]);
    // Non-syncable types carry an empty list, so there are no orphan remote types.
    expect(
      getPlugin("maven.maven")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual([]);
    expect(
      getPlugin("container.container-push")?.entities.repository
        ?.compatibleRemoteTypes,
    ).toEqual([]);
  });

  it("carries each repository's publication type (plugins with a publication endpoint)", () => {
    // 1:1 per plugin; note python repo publishes to the python.pypi type.
    expect(
      getPlugin("file.file")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual(["file.file"]);
    expect(
      getPlugin("python.python")?.entities.repository
        ?.compatiblePublicationTypes,
    ).toEqual(["python.pypi"]);
    expect(
      getPlugin("rpm.rpm")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual(["rpm.rpm"]);
    // Non-publishable types carry an empty list.
    expect(
      getPlugin("npm.npm")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual([]);
    expect(
      getPlugin("maven.maven")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual([]);
    expect(
      getPlugin("container.container")?.entities.repository
        ?.compatiblePublicationTypes,
    ).toEqual([]);
  });

  it("resolves variants to their own pulp_type", () => {
    expect(getPlugin("rpm.uln")?.entities.remote).toBeDefined();
    expect(getPlugin("file.git")?.entities.remote).toBeDefined();
    expect(getPlugin("python.pypi")?.entities.distribution).toBeDefined();
  });

  it("models deb's per-entity pulp_types (repository, remote, distribution, publications)", () => {
    const repo = getPlugin("deb.deb")?.entities.repository;
    expect(repo?.compatibleRemoteTypes).toEqual(["deb.apt-remote"]);
    expect(repo?.compatiblePublicationTypes).toEqual([
      "deb.apt-publication",
      "deb.verbatim-publication",
    ]);
    // The deb entities carry distinct pulp_types resolved under their own keys.
    expect(getPlugin("deb.apt-remote")?.entities.remote).toBeDefined();
    expect(
      getPlugin("deb.apt-distribution")?.entities.distribution,
    ).toBeDefined();
    // Verbatim overrides the apiPath slug; APT keeps the plugin default.
    expect(
      getPlugin("deb.verbatim-publication")?.entities.publication?.apiPath,
    ).toBe("deb/verbatim");
    expect(
      getPlugin("deb.apt-publication")?.entities.publication?.apiPath,
    ).toBe("deb/apt");
    expect(
      resolvePulpTypeByApiPath({ entity: "distribution", apiPath: "deb/apt" }),
    ).toBe("deb.apt-distribution");
  });

  it("models ansible's three remote variants and non-publishable repository", () => {
    const repo = getPlugin("ansible.ansible")?.entities.repository;
    expect(repo?.compatibleRemoteTypes).toEqual([
      "ansible.collection",
      "ansible.role",
      "ansible.git",
    ]);
    expect(repo?.compatiblePublicationTypes).toEqual([]);
    expect(getPlugin("ansible.collection")?.entities.remote).toBeDefined();
    expect(getPlugin("ansible.role")?.entities.remote).toBeDefined();
    expect(getPlugin("ansible.git")?.entities.remote).toBeDefined();
  });

  it("models ostree (syncable, no publication)", () => {
    const repo = getPlugin("ostree.ostree")?.entities.repository;
    expect(repo?.compatibleRemoteTypes).toEqual(["ostree.ostree"]);
    expect(repo?.compatiblePublicationTypes).toEqual([]);
    expect(getPlugin("ostree.ostree")?.entities.publication).toBeUndefined();
  });

  it("hoists plugin-level concerns to every entity it implements", () => {
    // Fully-invariant plugin: one app declared once reaches all four slots.
    const gem = getPlugin("gem.gem");
    for (const entity of [
      "repository",
      "remote",
      "distribution",
      "publication",
    ] as const) {
      expect(gem?.entities[entity]).toBeDefined();
    }
    const installed = [{ component: "gem" }] as VersionResponse[];
    expect(gem?.isAvailable(installed)).toBe(true);
    // rest.apiPath is per entity: default reaches repo/dist/pub; only variants override.
    expect(getPlugin("rpm.rpm")?.entities.distribution?.apiPath).toBe(
      "rpm/rpm",
    );
    expect(getPlugin("rpm.uln")?.entities.remote?.apiPath).toBe("rpm/uln");
  });
});

describe("getPlugin", () => {
  it("returns a plugin with every entity it implements", () => {
    const file = getPlugin("file.file");
    expect(file?.pulpType).toBe("file.file");
    expect(Object.keys(file?.entities ?? {}).sort()).toEqual([
      "distribution",
      "publication",
      "remote",
      "repository",
    ]);
  });

  it("returns undefined for an unknown pulp_type", () => {
    expect(getPlugin("nope.nope")).toBeUndefined();
  });
});

describe("getAvailablePlugins", () => {
  it("lists plugins implementing an entity whose package is installed", () => {
    const installed = [{ component: "file" }] as VersionResponse[];
    const remotes = getAvailablePlugins({ entity: "remote", installed });
    const pulpTypes = remotes.map((p) => p.pulpType);
    // Only the file plugin is installed → file.file + file.git remotes; no rpm.
    expect(pulpTypes).toContain("file.file");
    expect(pulpTypes).toContain("file.git");
    expect(pulpTypes).not.toContain("rpm.rpm");
    // Nothing installed → nothing available.
    expect(
      getAvailablePlugins({ entity: "remote", installed: [] }),
    ).toHaveLength(0);
  });
});

describe("resolvePulpTypeByApiPath", () => {
  it("reverse-maps (entity, apiPath) to the catalog pulp_type", () => {
    expect(
      resolvePulpTypeByApiPath({
        entity: "repository",
        apiPath: "python/python",
      }),
    ).toBe("python.python");
    // Non-"doubled" distribution slug.
    expect(
      resolvePulpTypeByApiPath({
        entity: "distribution",
        apiPath: "python/pypi",
      }),
    ).toBe("python.pypi");
  });

  it("returns undefined for an unmodelled apiPath", () => {
    expect(
      resolvePulpTypeByApiPath({
        entity: "repository",
        apiPath: "bogus/bogus",
      }),
    ).toBeUndefined();
  });
});

describe("buildCatalog", () => {
  const makeRemote = (): IPluginDefinition => ({
    app: { isAvailable: () => true },
    rest: { pulpType: "dup.dup", apiPath: "dup/dup" },
    entities: { remote: {} },
  });

  it("throws on a duplicate (entity, pulp_type)", () => {
    expect(() => buildCatalog([makeRemote(), makeRemote()])).toThrow(
      /Duplicate catalog entry/,
    );
  });

  it("returns a deeply-frozen, read-only catalog", () => {
    const catalog = buildCatalog([makeRemote()]);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog["dup.dup"])).toBe(true);
    expect(Object.isFrozen(catalog["dup.dup"].entities.remote)).toBe(true);
    expect(() => {
      (catalog as Record<string, unknown>)["x.x"] = {};
    }).toThrow();
  });

  it("hoists plugin rest into a slot whose overrides are empty", () => {
    const catalog = buildCatalog([
      {
        app: { isAvailable: () => true },
        rest: { pulpType: "test.test", apiPath: "test/test" },
        entities: {
          repository: {
            compatibleRemoteTypes: [],
            compatiblePublicationTypes: [],
            contentChanges: null,
            archiveImport: false,
          },
        },
      },
    ]);
    const plugin = catalog["test.test"];
    expect(plugin.entities.repository?.apiPath).toBe("test/test");
    expect(plugin.entities.repository?.compatibleRemoteTypes).toEqual([]);
  });

  it("throws on a duplicate content pulp_type", () => {
    const def: IPluginDefinition = {
      app: { isAvailable: () => true },
      rest: { pulpType: "dupc.dupc", apiPath: "dupc/dupc" },
      entities: {},
      content: [
        { pulpType: "dupc.a", apiPath: "dupc/a" },
        { pulpType: "dupc.a", apiPath: "dupc/b" },
      ],
    };
    expect(() => buildCatalog([def])).toThrow(/Duplicate content type/);
  });

  it("throws on a duplicate content apiPath", () => {
    const def: IPluginDefinition = {
      app: { isAvailable: () => true },
      rest: { pulpType: "dupp.dupp", apiPath: "dupp/dupp" },
      entities: {},
      content: [
        { pulpType: "dupp.a", apiPath: "dupp/x" },
        { pulpType: "dupp.b", apiPath: "dupp/x" },
      ],
    };
    expect(() => buildCatalog([def])).toThrow(/Duplicate content apiPath/);
  });
});

describe("repository content changes", () => {
  it("carries how each repository's content is changed", () => {
    expect(getPlugin("file.file")?.entities.repository?.contentChanges).toBe(
      "modify",
    );
    expect(getPlugin("rpm.rpm")?.entities.repository?.contentChanges).toBe(
      "modify",
    );
    // Container sync repositories use add/ and remove/; push repositories have neither.
    expect(
      getPlugin("container.container")?.entities.repository?.contentChanges,
    ).toBe("addRemove");
    expect(
      getPlugin("container.container-push")?.entities.repository
        ?.contentChanges,
    ).toBeNull();
  });

  it("getRepositoryContentTypes lists the plugin's content types, also for variants", () => {
    expect(
      getRepositoryContentTypes("file.file").map((ct) => ct.pulpType),
    ).toEqual(["file.file"]);
    expect(
      getRepositoryContentTypes("container.container-push").map(
        (ct) => ct.pulpType,
      ),
    ).toContain("container.tag");
    expect(getRepositoryContentTypes("nope.nope")).toEqual([]);
  });

  it("getRepositoryTypesForContent lists repositories that can take a content type", () => {
    expect(getRepositoryTypesForContent("file.file")).toEqual(["file.file"]);
    // Push repositories can't add content.
    expect(getRepositoryTypesForContent("container.tag")).toEqual([
      "container.container",
    ]);
    expect(getRepositoryTypesForContent("nope.nope")).toEqual([]);
  });

  it("getRepositoryTypesForPublication lists repositories that publish a type", () => {
    expect(getRepositoryTypesForPublication("file.file")).toEqual([
      "file.file",
    ]);
    expect(getRepositoryTypesForPublication("python.pypi")).toEqual([
      "python.python",
    ]);
    expect(
      getRepositoryTypesForPublication("deb.verbatim-publication"),
    ).toEqual(["deb.deb"]);
    expect(getRepositoryTypesForPublication("nope.nope")).toEqual([]);
  });
});

describe("uploads", () => {
  it("declares how each uploadable content type is uploaded", () => {
    expect(getContentType("file.file")?.uploadable?.mechanism).toBe("upload");
    expect(getContentType("rpm.package")?.uploadable?.mechanism).toBe("upload");
    expect(getContentType("gem.gem")?.uploadable?.mechanism).toBe("create");
    // Pushed or synced only: no upload.
    expect(getContentType("container.tag")?.uploadable).toBeUndefined();
  });

  it("marks OSTree repositories as importing archives", () => {
    expect(getPlugin("ostree.ostree")?.entities.repository?.archiveImport).toBe(
      true,
    );
    expect(getPlugin("file.file")?.entities.repository?.archiveImport).toBe(
      false,
    );
  });
});

describe("content types", () => {
  it("getContentType resolves identity + capabilities", () => {
    expect(getContentType("rpm.package")?.apiPath).toBe("rpm/packages");
    expect(getContentType("file.file")?.uploadable?.mechanism).toBe("upload");
    // A read-only type has no upload capability.
    expect(getContentType("rpm.packagegroup")?.uploadable).toBeUndefined();
    expect(getContentType("nope.nope")).toBeUndefined();
  });

  it("getContentTypes filters by installed plugin", () => {
    expect(getContentTypes({ installed: [] })).toHaveLength(0);
    const rpmOnly = getContentTypes({
      installed: [{ component: "rpm" }] as VersionResponse[],
    });
    const pulpTypes = rpmOnly.map((ct) => ct.pulpType);
    expect(pulpTypes).toContain("rpm.package");
    expect(pulpTypes).toHaveLength(11);
    expect(pulpTypes).not.toContain("file.file");
  });

  it("resolveContentTypeByApiPath maps slug → content pulp_type", () => {
    expect(resolveContentTypeByApiPath({ apiPath: "file/files" })).toBe(
      "file.file",
    );
    expect(resolveContentTypeByApiPath({ apiPath: "rpm/packages" })).toBe(
      "rpm.package",
    );
    expect(resolveContentTypeByApiPath({ apiPath: "python/packages" })).toBe(
      "python.python",
    );
    expect(
      resolveContentTypeByApiPath({ apiPath: "bogus/bogus" }),
    ).toBeUndefined();
    // Endpoint-less types carry no apiPath, so they aren't in the path index.
    expect(resolveContentTypeByApiPath({ apiPath: "" })).toBeUndefined();
  });
});

describe("repository actions", () => {
  const actionKeys = ({
    pulpType,
    target = "repository",
  }: {
    pulpType: string;
    target?: string;
  }) =>
    (getPlugin(pulpType)?.entities.repository?.actions ?? [])
      .filter((action) => action.target === target)
      .map((action) => action.key);

  it("defaults to no actions", () => {
    expect(actionKeys({ pulpType: "file.file" })).toEqual([]);
  });

  it("models ansible's signing, marking and copy actions", () => {
    expect(actionKeys({ pulpType: "ansible.ansible" })).toEqual([
      "sign",
      "mark",
      "unmark",
      "copy-collection-version",
      "move-collection-version",
      "rebuild-metadata",
      "copy",
    ]);
  });

  it("models container and push-repository actions", () => {
    expect(actionKeys({ pulpType: "container.container" })).toContain(
      "build-image",
    );
    expect(actionKeys({ pulpType: "container.container-push" })).toEqual(
      expect.arrayContaining(["remove-image", "remove-signatures", "migrate"]),
    );
  });

  it("models rpm, deb, python and maven actions", () => {
    expect(actionKeys({ pulpType: "rpm.rpm" })).toEqual([
      "copy",
      "comps",
      "prune",
    ]);
    expect(actionKeys({ pulpType: "deb.deb" })).toEqual(["copy"]);
    expect(actionKeys({ pulpType: "python.python" })).toEqual([
      "repair-metadata",
    ]);
    expect(actionKeys({ pulpType: "maven.maven" })).toHaveLength(5);
  });

  it("scans rpm and python versions", () => {
    expect(actionKeys({ pulpType: "rpm.rpm", target: "version" })).toEqual([
      "scan",
    ]);
    expect(
      actionKeys({ pulpType: "python.python", target: "version" }),
    ).toEqual(["scan"]);
  });

  it("fills collection endpoints' repository parameter", () => {
    const prune = getPlugin("rpm.rpm")?.entities.repository?.actions.find(
      (action) => action.key === "prune",
    );
    expect(prune?.path).toBe("/rpm/prune/");
    expect(prune?.repositoryParam).toEqual({ key: "repo_hrefs", list: true });
  });
});

describe("OpenPGP keyrings", () => {
  it("models the keyring and its distribution under core.openpgp", () => {
    const plugin = getPlugin("core.openpgp");
    expect(plugin?.entities.repository?.apiPath).toBe("core/openpgp_keyring");
    expect(plugin?.entities.distribution?.apiPath).toBe("core/openpgp");
    expect(plugin?.entities.repository?.contentChanges).toBe("modify");
  });

  it("holds the OpenPGP content types", () => {
    expect(
      getRepositoryContentTypes("core.openpgp").map((type) => type.pulpType),
    ).toContain("core.openpgp_publickey");
  });

  it("resolves both apiPaths back to the shared pulp_type", () => {
    expect(
      resolvePulpTypeByApiPath({
        entity: "repository",
        apiPath: "core/openpgp_keyring",
      }),
    ).toBe("core.openpgp");
    expect(
      resolvePulpTypeByApiPath({
        entity: "distribution",
        apiPath: "core/openpgp",
      }),
    ).toBe("core.openpgp");
  });
});
