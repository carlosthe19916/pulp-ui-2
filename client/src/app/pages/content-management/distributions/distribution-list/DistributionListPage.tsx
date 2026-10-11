import type React from "react";

import { DistributionTaskTrackerProvider } from "./context/DistributionTaskTrackerProvider";
import { DistributionList } from "./DistributionList";

/** Wraps the list in the task tracker so delete tasks can be tracked per row. */
export const DistributionListPage: React.FC = () => (
  <DistributionTaskTrackerProvider>
    <DistributionList />
  </DistributionTaskTrackerProvider>
);
