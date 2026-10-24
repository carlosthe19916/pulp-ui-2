import { cleanFormValues } from "@app/utils/formSchema";

/**
 * Typed shared base of a publication write body. Publications are created against a
 * repository (optionally a specific version) and are immutable afterwards, so there
 * is only a create payload — no patch. Plugin extras ride the open index signature.
 */
export interface IPublicationWriteBase {
  repository?: string;
  repository_version?: string;
}

/** Form values for a publication: the typed base + dynamic plugin extras. */
export type PublicationFormValues = IPublicationWriteBase &
  Record<string, unknown>;

/** A publication create payload: the typed base + whatever plugin extras survived. */
export type PublicationWriteBody = IPublicationWriteBase &
  Record<string, unknown>;

/** Build the POST body for creating a publication of the selected plugin type. */
export const valuesToCreate = (
  values: Record<string, unknown>,
): PublicationWriteBody => cleanFormValues<PublicationWriteBody>(values);
