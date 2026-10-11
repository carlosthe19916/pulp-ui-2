import type React from "react";

import { EntityTaskTrackerProvider } from "@app/context/EntityTaskTracker/EntityTaskTrackerProvider";

import { RepositoryList } from "./RepositoryList";

/** Mounts the shared task tracker around the list so delete tasks show per row. */
export const RepositoryListPage: React.FC = () => (
  <EntityTaskTrackerProvider>
    <RepositoryList />
  </EntityTaskTrackerProvider>
);
