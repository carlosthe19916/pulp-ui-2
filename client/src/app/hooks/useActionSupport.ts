import { useApiStatus } from "@app/hooks/useApiStatus";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  getPulpType,
  type IRepositoryAction,
  isActionSupported,
  type PulpType,
} from "@catalog";

/**
 * Item props that disable a repository action this server can't run (it needs a newer
 * plugin inside a domain), with the reason as tooltip; `{}` otherwise.
 */
export const useActionSupport = (pulpType: PulpType) => {
  const { plugins } = useApiStatus();
  const domain = useSelectedDomain();
  const pluginId = getPulpType(pulpType)?.pluginId;
  return (action: IRepositoryAction) =>
    isActionSupported({
      pulpType,
      action,
      domainEnabled: domain.enabled,
      installed: plugins,
    })
      ? {}
      : {
          isAriaDisabled: true,
          tooltipProps: {
            content: `Needs pulp_${pluginId} ${action.domainScopedSince} or newer when domains are enabled`,
          },
        };
};
