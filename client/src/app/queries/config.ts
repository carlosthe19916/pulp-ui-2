import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const MAX_RETRIES = 3;

/** A 4xx answer (403, 404, …) won't change on retry; show it at once. */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < MAX_RETRIES;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10000,
      retry: shouldRetry,
    },
  },
});
