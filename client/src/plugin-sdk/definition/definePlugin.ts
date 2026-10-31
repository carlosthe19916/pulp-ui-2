import type { IPluginDefinition, TypesOf } from "./types";

/** Cross-references a definition makes to its own types; another plugin's type fails. */
interface IOwnTypeChecks<D extends IPluginDefinition> {
  repository?: {
    [T in keyof D["repository"]]: {
      compatibleRemoteTypes: readonly TypesOf<D, "remote">[];
      compatiblePublicationTypes: readonly TypesOf<D, "publication">[];
    };
  };
  acs?: { remoteType: TypesOf<D, "remote"> };
}

/**
 * Declares a plugin's facts. `const` keeps its pulp_types literal, so the UI layer can require
 * a piece per type and the app gets typed unions of every type.
 */
export const definePlugin = <const D extends IPluginDefinition>(
  definition: D & IOwnTypeChecks<D>,
): D => definition;
