import { useApiStatus } from "@app/hooks/useApiStatus";
import { type EntityType, getAvailablePlugins, type IPlugin } from "@catalog";

/** pulp_types that can't be created from the UI (e.g. push repos are populated by `podman push`). */
export const NON_CREATABLE_TYPES = new Set(["container.container-push"]);

/** Catalog plugins that implement `kind`, are installed in this environment, and UI-creatable. */
export const useCreatablePlugins = (kind: EntityType): IPlugin[] => {
  const plugins = useApiStatus().plugins;
  return getAvailablePlugins({ entity: kind, installed: plugins }).filter(
    (plugin) => !NON_CREATABLE_TYPES.has(plugin.pulpType),
  );
};
