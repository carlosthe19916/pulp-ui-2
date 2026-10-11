import type React from "react";

import { EntityTaskTrackerProvider } from "@app/context/EntityTaskTracker/EntityTaskTrackerProvider";

import { DistributionList } from "./DistributionList";

/** Mounts the shared task tracker around the list so delete tasks show per row. */
export const DistributionListPage: React.FC = () => (
  <EntityTaskTrackerProvider>
    <DistributionList />
  </EntityTaskTrackerProvider>
);
