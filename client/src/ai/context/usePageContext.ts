import { useAgentContext } from "@copilotkit/react-core/v2";
import { useRouterState } from "@tanstack/react-router";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

/** Tells the assistant which page and domain the user is on, so "this domain" makes sense. */
export const usePageContext = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const domain = useSelectedDomain();

  useAgentContext({
    description: "Where the user is in the Pulp UI",
    value: {
      page: pathname,
      domain: domain.enabled ? domain.name : "Pulp runs without domains",
    },
  });
};
