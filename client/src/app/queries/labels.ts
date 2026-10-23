import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { SetLabelResponse, UnsetLabelResponse } from "@app/client";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

export interface ISetLabelVariables {
  href: string;
  key: string;
  value: string | null;
}

export interface IUnsetLabelVariables {
  href: string;
  key: string;
}

/**
 * Sets one label on any labelled resource (`{href}set_label/`, synchronous).
 * Labels live on the resource itself, so `invalidateKey` is its family's
 * detail key (each family has its own key factory).
 */
export const useSetLabelMutation = ({
  invalidateKey,
  ...options
}: { invalidateKey: QueryKey } & IMutationCallbacks<
  SetLabelResponse,
  ISetLabelVariables
>) => {
  const queryClient = useQueryClient();
  return useMutation<SetLabelResponse, DrfAxiosError, ISetLabelVariables>({
    mutationFn: async ({ href, key, value }) =>
      (
        await axiosInstance.post<SetLabelResponse>(
          `${toProxyHref(href)}set_label/`,
          { key, value },
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
      options.onSuccess?.(data, vars);
    },
    onError: options.onError,
  });
};

/** Removes one label (`{href}unset_label/`, synchronous). */
export const useUnsetLabelMutation = ({
  invalidateKey,
  ...options
}: { invalidateKey: QueryKey } & IMutationCallbacks<
  UnsetLabelResponse,
  IUnsetLabelVariables
>) => {
  const queryClient = useQueryClient();
  return useMutation<UnsetLabelResponse, DrfAxiosError, IUnsetLabelVariables>({
    mutationFn: async ({ href, key }) =>
      (
        await axiosInstance.post<UnsetLabelResponse>(
          `${toProxyHref(href)}unset_label/`,
          { key },
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
      options.onSuccess?.(data, vars);
    },
    onError: options.onError,
  });
};
