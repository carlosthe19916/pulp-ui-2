import type React from "react";

import type { EntityType } from "@catalog";
import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";

import type { VersionResponse } from "@app/client";
import {
  ApiStatusContext,
  type IApiStatusContext,
} from "@app/context/ApiStatus/ApiStatusContext";

import { useCreatablePlugins } from "./useCreatablePlugins";

interface IWrapperProps {
  children: React.ReactNode;
}

/** Render the hook with the given installed plugins and return the pulp_types it yields. */
const creatableTypes = async ({
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
  const wrapper: React.FC<IWrapperProps> = ({ children }) => (
    <ApiStatusContext value={value}>{children}</ApiStatusContext>
  );
  const { result } = await renderHook(() => useCreatablePlugins(kind), {
    wrapper,
  });
  return result.current.map((p) => p.pulpType);
};

describe("useCreatablePlugins", () => {
  it("returns nothing when no plugin is installed", async () => {
    expect(await creatableTypes({ kind: "distribution", plugins: [] })).toEqual(
      [],
    );
  });

  it("returns the installed plugin's distribution types", async () => {
    const types = await creatableTypes({
      kind: "distribution",
      plugins: [{ component: "file" } as VersionResponse],
    });
    expect(types).toContain("file.file");
  });

  it("filters out non-creatable types (push repositories)", async () => {
    const types = await creatableTypes({
      kind: "repository",
      plugins: [{ component: "container" } as VersionResponse],
    });
    expect(types).toContain("container.container");
    expect(types).not.toContain("container.container-push");
  });
});
