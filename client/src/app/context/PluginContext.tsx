import React, { createContext, useContext, useMemo } from "react";

import type { StatusResponse, VersionResponse } from "@app/client";
import { useStatusQuery } from "@app/queries/status";

interface PluginContextValue {
  status: StatusResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  plugins: VersionResponse[];
  isPluginInstalled: (componentName: string) => boolean;
  getPluginVersion: (componentName: string) => string | undefined;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error("usePlugins must be used within a PluginProvider");
  }
  return context;
};

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

  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
};
