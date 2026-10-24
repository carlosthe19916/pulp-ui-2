import { cleanFormValues } from "@app/utils/formSchema";

/**
 * Typed shared base of every distribution write body (pulpcore
 * DistributionSerializer fields). Plugin-specific extras (e.g. a `publication`
 * picker) ride the open index signature and pass through untouched.
 */
export interface IDistributionWriteBase {
  name?: string;
  base_path?: string;
  hidden?: boolean;
  repository?: string | null;
}

/** Form values for a distribution: the typed base + dynamic plugin extras. */
export type DistributionFormValues = IDistributionWriteBase &
  Record<string, unknown>;

/** A distribution write payload: the typed base + whatever plugin extras survived. */
export type DistributionWriteBody = IDistributionWriteBase &
  Record<string, unknown>;

/** Build the POST body for creating a distribution of the selected plugin type. */
export const valuesToCreate = (
  values: Record<string, unknown>,
): DistributionWriteBody => cleanFormValues<DistributionWriteBody>(values);

/** Build the PATCH body for editing a distribution. */
export const valuesToPatch = (
  values: Record<string, unknown>,
): Partial<DistributionWriteBody> =>
  cleanFormValues<DistributionWriteBody>(values);
