import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { EntityType } from "@catalog";
import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";
import {
  ApiStatusContext,
  type IApiStatusContext,
} from "@app/context/ApiStatus/ApiStatusContext";

import { useCreatablePlugins } from "./useCreatablePlugins";

/** Render the hook through a probe and return the pulp_types it yields. */
const creatableTypes = ({
  kind,
  plugins,
}: {
  kind: EntityType;
  plugins: VersionResponse[];
}) => {
  const value: IApiStatusContext = {
    status: undefined,
    isLoading: false,
    error: null,
    plugins,
    isPluginInstalled: () => false,
    getPluginVersion: () => undefined,
  };
  const Probe: React.FC = () => (
    <>{useCreatablePlugins(kind).map((p) => `[${p.pulpType}]`)}</>
  );
  return renderToStaticMarkup(
    <ApiStatusContext value={value}>
      <Probe />
    </ApiStatusContext>,
  );
};

describe("useCreatablePlugins", () => {
  it("returns nothing when no plugin is installed", () => {
    expect(creatableTypes({ kind: "distribution", plugins: [] })).toBe("");
  });

  it("returns the installed plugin's distribution types", () => {
    const html = creatableTypes({
      kind: "distribution",
      plugins: [{ component: "file" } as VersionResponse],
    });
    expect(html).toContain("[file.file]");
  });

  it("filters out non-creatable types (push repositories)", () => {
    const html = creatableTypes({
      kind: "repository",
      plugins: [{ component: "container" } as VersionResponse],
    });
    expect(html).toContain("[container.container]");
    expect(html).not.toContain("[container.container-push]");
  });
});
