import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  OstreeImportAll,
  RepositoryResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { repositoryKeys } from "./repositories";
import { taskKeys } from "./tasks";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";
import { extractIdFromHref } from "./utils/pulpHref";

/**
 * Imports an uploaded OSTree archive (an artifact) into a new repository version:
 * every ref with `import_all/`, or one ref's commits with `import_commits/`.
 */
export const useOstreeImportMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { repository: RepositoryResponse; body: OstreeImportAll & { ref?: string } }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { repository: RepositoryResponse; body: OstreeImportAll & { ref?: string } }
  >({
    mutationFn: async ({ repository, body }) => {
      const id = extractIdFromHref(repository.pulp_href ?? "");
      const action = body.ref ? "import_commits" : "import_all";
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath(`repositories/ostree/ostree/${id}/${action}/`, domain),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
