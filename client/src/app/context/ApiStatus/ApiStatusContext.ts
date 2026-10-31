import { createContext } from "react";

import type { AxiosError } from "axios";

import type { StatusResponse, VersionResponse } from "@app/client";

export interface IApiStatusContext {
  status: StatusResponse | undefined;
  isLoading: boolean;
  error: AxiosError<unknown> | null;
  /** The installed components (`/status/` versions). */
  plugins: VersionResponse[];
}

export const ApiStatusContext = createContext<IApiStatusContext | null>(null);
