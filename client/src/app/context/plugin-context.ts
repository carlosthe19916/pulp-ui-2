import { createContext } from "react";

import type { StatusResponse, VersionResponse } from "@app/client";

export interface PluginContextValue {
  status: StatusResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  plugins: VersionResponse[];
  isPluginInstalled: (componentName: string) => boolean;
  getPluginVersion: (componentName: string) => string | undefined;
}

export const PluginContext = createContext<PluginContextValue | null>(null);
