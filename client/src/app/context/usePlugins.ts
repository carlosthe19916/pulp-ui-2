import { use } from "react";

import { PluginContext } from "./plugin-context";

export const usePlugins = () => {
  const context = use(PluginContext);
  if (!context) {
    throw new Error("usePlugins must be used within a PluginProvider");
  }
  return context;
};
