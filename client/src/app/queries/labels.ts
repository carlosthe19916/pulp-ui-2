import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  SetLabel,
  SetLabelResponse,
  UnsetLabel,
  UnsetLabelResponse,
} from "@app/client";

import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

export interface ISetLabelVariables extends SetLabel {
  href: string;
}

export interface IUnsetLabelVariables extends UnsetLabel {
  href: string;
}

/**
 * Sets one label on any labelled resource (`{href}set_label/`, synchronous);
 * `invalidateKey` is its family's detail key.
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
