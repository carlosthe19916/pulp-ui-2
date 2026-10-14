import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { EntityType } from "@catalog";
import type { VersionResponse } from "@app/client";
import {
  ApiStatusContext,
  type IApiStatusContext,
} from "@app/context/ApiStatus/ApiStatusContext";

import { useCreatablePlugins } from "./useCreatablePlugins";

/** Render the hook through a probe and return the pulp_types it yields. */
const creatableTypes = (kind: EntityType, plugins: VersionResponse[]) => {
  const value: IApiStatusContext = {
    status: undefined,
    isLoading: false,
    error: null,
    plugins,
    isPluginInstalled: () => false,
    getPluginVersion: () => undefined,
  };
  const Probe = () => (
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
    expect(creatableTypes("distribution", [])).toBe("");
  });

  it("returns the installed plugin's distribution types", () => {
    const html = creatableTypes("distribution", [
      { component: "file" } as VersionResponse,
    ]);
    expect(html).toContain("[file.file]");
  });

  it("filters out non-creatable types (push repositories)", () => {
    const html = creatableTypes("repository", [
      { component: "container" } as VersionResponse,
    ]);
    expect(html).toContain("[container.container]");
    expect(html).not.toContain("[container.container-push]");
  });
});
