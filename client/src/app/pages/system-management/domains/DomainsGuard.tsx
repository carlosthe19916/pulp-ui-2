import type React from "react";

import { EntityTaskTrackerProvider } from "@app/context/EntityTaskTracker/EntityTaskTrackerProvider";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import { DomainList } from "./DomainList";
import { DomainsDisabledEmptyState } from "./DomainsDisabledEmptyState";

/** Mounts the list only when domains are enabled, so its queries don't run otherwise. */
export const DomainsGuard: React.FC = () => {
  const { enabled } = useDefaultDomain();
  if (!enabled) return <DomainsDisabledEmptyState />;
  return (
    <EntityTaskTrackerProvider>
      <DomainList />
    </EntityTaskTrackerProvider>
  );
};
