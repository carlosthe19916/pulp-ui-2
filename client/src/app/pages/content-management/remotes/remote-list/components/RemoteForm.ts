import { cleanFormValues } from "@app/components/PluginForm/formSchema";

/**
 * Typed shared base of every remote write body (the pulpcore RemoteSerializer
 * identity fields). The remote form is large and mostly optional (auth, TLS,
 * timeouts, limits) — those ride the open index signature. Number inputs already
 * arrive coerced and empty values are stripped, so `cleanFormValues` is enough.
 */
export interface IRemoteWriteBase {
  name?: string;
  url?: string;
  policy?: string;
}

/** Form values for a remote: the typed base + dynamic plugin extras. */
export type RemoteFormValues = IRemoteWriteBase & Record<string, unknown>;

/** A remote write payload: the typed base + whatever plugin extras survived. */
export type RemoteWriteBody = IRemoteWriteBase & Record<string, unknown>;

/** Build the POST body for creating a remote of the selected plugin type. */
export const valuesToCreate = (
  values: Record<string, unknown>,
): RemoteWriteBody => cleanFormValues<RemoteWriteBody>(values);

/** Build the PATCH body for editing a remote. */
export const valuesToPatch = (
  values: Record<string, unknown>,
): Partial<RemoteWriteBody> => cleanFormValues<RemoteWriteBody>(values);
