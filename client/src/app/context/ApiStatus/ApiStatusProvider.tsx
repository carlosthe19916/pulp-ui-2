import type React from "react";
import { useMemo } from "react";

import { useStatusQuery } from "@app/queries/status";

import type { IApiStatusContext } from "./ApiStatusContext";
import { ApiStatusContext } from "./ApiStatusContext";

interface IApiStatusProviderProps {
  children: React.ReactNode;
}

export const ApiStatusProvider: React.FC<IApiStatusProviderProps> = ({
  children,
}) => {
  const { data: status, isLoading, error } = useStatusQuery();

  const value = useMemo<IApiStatusContext>(
    () => ({ status, isLoading, error, plugins: status?.versions ?? [] }),
    [status, isLoading, error],
  );

  return <ApiStatusContext value={value}>{children}</ApiStatusContext>;
};
