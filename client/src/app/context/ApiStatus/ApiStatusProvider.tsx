import type React from "react";
import { useMemo } from "react";

import { useStatusQuery } from "@app/queries/status";

import { ApiStatusContext } from "./ApiStatusContext";
import type { IApiStatusContext } from "./ApiStatusContext";

export const ApiStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: status, isLoading, error } = useStatusQuery();

  const value = useMemo<IApiStatusContext>(() => {
    const plugins = status?.versions ?? [];
    return {
      status,
      isLoading,
      error,
      plugins,
      isPluginInstalled: (componentName: string) =>
        plugins.some((p) => p.component === componentName),
      getPluginVersion: (componentName: string) =>
        plugins.find((p) => p.component === componentName)?.version,
    };
  }, [status, isLoading, error]);

  return <ApiStatusContext value={value}>{children}</ApiStatusContext>;
};
