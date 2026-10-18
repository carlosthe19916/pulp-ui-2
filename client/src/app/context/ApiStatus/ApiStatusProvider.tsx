import type React from "react";

import { useStatusQuery } from "@app/queries/status";

import { ApiStatusContext } from "./ApiStatusContext";
import type { IApiStatusContext } from "./ApiStatusContext";

export const ApiStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: status, isLoading, error } = useStatusQuery();

  const plugins = status?.versions ?? [];

  const isPluginInstalled = (componentName: string) =>
    plugins.some((p) => p.component === componentName);

  const getPluginVersion = (componentName: string) =>
    plugins.find((p) => p.component === componentName)?.version;

  const value: IApiStatusContext = {
    status,
    isLoading,
    error,
    plugins,
    isPluginInstalled,
    getPluginVersion,
  };

  return <ApiStatusContext value={value}>{children}</ApiStatusContext>;
};
