import React, { useMemo } from "react";

import { useStatusQuery } from "@app/queries/status";

import { PluginContext } from "./plugin-context";
import type { PluginContextValue } from "./plugin-context";
export const PluginProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: status, isLoading, error } = useStatusQuery();

  const plugins = useMemo(() => status?.versions ?? [], [status]);

  const isPluginInstalled = useMemo(
    () => (componentName: string) =>
      plugins.some((p) => p.component === componentName),
    [plugins],
  );

  const getPluginVersion = useMemo(
    () => (componentName: string) =>
      plugins.find((p) => p.component === componentName)?.version,
    [plugins],
  );

  const value: PluginContextValue = {
    status,
    isLoading,
    error: error as Error | null,
    plugins,
    isPluginInstalled,
    getPluginVersion,
  };

  return <PluginContext value={value}>{children}</PluginContext>;
};
