import type React from "react";

import { RemoteTaskTrackerProvider } from "./context/RemoteTaskTrackerProvider";
import { RemoteList } from "./RemoteList";

/** Wraps the list in the task tracker so delete tasks can be tracked per row. */
export const RemoteListPage: React.FC = () => (
  <RemoteTaskTrackerProvider>
    <RemoteList />
  </RemoteTaskTrackerProvider>
);
