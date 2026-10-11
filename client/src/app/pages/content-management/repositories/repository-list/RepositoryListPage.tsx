import type React from "react";

import { RepositoryTaskTrackerProvider } from "./context/RepositoryTaskTrackerProvider";
import { RepositoryList } from "./RepositoryList";

/** Wraps the list in the task tracker so delete tasks can be tracked per row. */
export const RepositoryListPage: React.FC = () => (
  <RepositoryTaskTrackerProvider>
    <RepositoryList />
  </RepositoryTaskTrackerProvider>
);
