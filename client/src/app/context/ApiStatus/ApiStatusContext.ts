import { createContext } from "react";

import type { AxiosError } from "axios";

import type { StatusResponse, VersionResponse } from "@app/client";

export interface IApiStatusContext {
  status: StatusResponse | undefined;
  isLoading: boolean;
  error: AxiosError<unknown> | null;
  plugins: VersionResponse[];
  isPluginInstalled: (componentName: string) => boolean;
  getPluginVersion: (componentName: string) => string | undefined;
}

export const ApiStatusContext = createContext<IApiStatusContext | null>(null);
