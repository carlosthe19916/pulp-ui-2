import type { Domain, DomainResponse, PatchedDomain } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useDomainCreateMutation,
  useDomainDeleteMutation,
  useDomainUpdateMutation,
} from "@app/queries/domains";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Each action rethrows on failure so callers can keep a modal open on error. */
export const useDomainActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useDomainCreateMutation();
  const updateMutation = useDomainUpdateMutation();
  const deleteMutation = useDomainDeleteMutation();

  const createDomain = async (body: Domain) =>
    runAction(() => createMutation.mutateAsync(body), {
      successTitle: (result) => `Domain "${result.name}" created`,
      errorTitle: "Failed to create domain",
    });

  const updateDomain = async (domainId: string, body: PatchedDomain) => {
    const name = body.name ?? "";
    return runAction(() => updateMutation.mutateAsync({ domainId, body }), {
      successTitle: `Domain "${name}" updated`,
      errorTitle: "Failed to update domain",
      taskAware: true,
      taskTitle: `Domain "${name}" update started`,
    });
  };

  const deleteDomain = async (domain: DomainResponse) => {
    const domainId = extractIdFromHref(domain.pulp_href ?? "");
    return runAction(() => deleteMutation.mutateAsync(domainId), {
      successTitle: `Domain "${domain.name}" deleted`,
      errorTitle: "Failed to delete domain",
      taskAware: true,
      taskTitle: `Domain "${domain.name}" deletion started`,
    });
  };

  return {
    createDomain,
    updateDomain,
    deleteDomain,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
