import { use } from "react";

import type { Domain, DomainResponse, PatchedDomain } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useDomainCreateMutation,
  useDomainDeleteMutation,
  useDomainUpdateMutation,
} from "@app/queries/domains";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { DomainTaskTrackerContext } from "../context/DomainTaskTrackerContext";

/** Each action rethrows on failure so callers can keep a modal open on error. */
export const useDomainActions = () => {
  const { runAction } = useMutationAction();
  const { track } = use(DomainTaskTrackerContext);
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
    const result = await runAction(
      () => updateMutation.mutateAsync({ domainId, body }),
      {
        successTitle: `Domain "${name}" updated`,
        errorTitle: "Failed to update domain",
        taskAware: true,
        taskTitle: `Domain "${name}" update started`,
      },
    );
    if ("task" in result && result.task) {
      track(domainId, { kind: "update", taskHref: result.task });
    }
    return result;
  };

  const deleteDomain = async (domain: DomainResponse) => {
    const domainId = extractIdFromHref(domain.pulp_href ?? "");
    const result = await runAction(() => deleteMutation.mutateAsync(domainId), {
      successTitle: `Domain "${domain.name}" deleted`,
      errorTitle: "Failed to delete domain",
      taskAware: true,
      taskTitle: `Domain "${domain.name}" deletion started`,
    });
    if (result.task) {
      track(domainId, { kind: "delete", taskHref: result.task });
    }
    return result;
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
