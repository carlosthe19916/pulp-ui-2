import type React from "react";

import { useApiDomain } from "@app/hooks/useApiDomain";

import { DomainTaskTrackerProvider } from "./context/DomainTaskTrackerProvider";
import { DomainList } from "./DomainList";
import { DomainsDisabledEmptyState } from "./DomainsDisabledEmptyState";

/** Mounts the list only when domains are enabled, so its queries don't run otherwise. */
export const DomainsGuard: React.FC = () => {
  const { enabled } = useApiDomain();
  if (!enabled) return <DomainsDisabledEmptyState />;
  return (
    <DomainTaskTrackerProvider>
      <DomainList />
    </DomainTaskTrackerProvider>
  );
};
