import { use } from "react";

import { TaskTrackerContext } from "@app/context/TaskTracker/TaskTrackerContext";

export const useTaskTracker = () => {
  const context = use(TaskTrackerContext);
  if (!context) {
    throw new Error("useTaskTracker must be used within a TaskTrackerProvider");
  }
  return context;
};
