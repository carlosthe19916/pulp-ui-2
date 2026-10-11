import type React from "react";

import { EntityTaskTrackerProvider } from "@app/context/EntityTaskTracker/EntityTaskTrackerProvider";

import { RemoteList } from "./RemoteList";

/** Mounts the shared task tracker around the list so delete tasks show per row. */
export const RemoteListPage: React.FC = () => (
  <EntityTaskTrackerProvider>
    <RemoteList />
  </EntityTaskTrackerProvider>
);
