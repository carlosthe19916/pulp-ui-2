import React, { useMemo } from "react";

import { useStatusQuery } from "@app/queries/status";

import { ApiStatusContext } from "./ApiStatusContext";
import type { IApiStatusContext } from "./ApiStatusContext";

export const ApiStatusProvider: React.FC<{ children: React.ReactNode }> = ({
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

  const value: IApiStatusContext = {
    status,
    isLoading,
    error: error as Error | null,
    plugins,
    isPluginInstalled,
    getPluginVersion,
  };

  return <ApiStatusContext value={value}>{children}</ApiStatusContext>;
};
