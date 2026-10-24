import { cleanFormValues } from "@app/utils/formSchema";

/**
 * Typed base of every remote write body (pulpcore RemoteSerializer identity fields); the
 * many optional plugin fields ride the index signature.
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
): RemoteWriteBody =>
  // Number inputs arrive coerced and empty values are stripped already.
  cleanFormValues<RemoteWriteBody>(values);

/** Build the PATCH body for editing a remote. */
export const valuesToPatch = (
  values: Record<string, unknown>,
): Partial<RemoteWriteBody> => cleanFormValues<RemoteWriteBody>(values);
