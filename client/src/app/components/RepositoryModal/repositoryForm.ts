import { cleanFormValues } from "@app/utils/formSchema";

/**
 * Typed base of every repository write body (pulpcore RepositorySerializer fields);
 * plugin extras ride the index signature.
 */
export interface IRepositoryWriteBase {
  name?: string;
  description?: string | null;
  retain_repo_versions?: number | null;
  remote?: string | null;
  autopublish?: boolean;
}

/** Form values for a repository: the typed base + dynamic plugin extras. */
export type RepositoryFormValues = IRepositoryWriteBase &
  Record<string, unknown>;

/** A repository write payload: the typed base + whatever plugin extras survived. */
export type RepositoryWriteBody = IRepositoryWriteBase &
  Record<string, unknown>;

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

/**
 * Normalize raw form values into a repository write body: coerce
 * `retain_repo_versions` to a number (the number input can leave an empty string),
 * then strip empty-string/undefined/null so omitted optionals aren't sent.
 */
const normalize = (values: Record<string, unknown>): RepositoryWriteBody =>
  cleanFormValues<RepositoryWriteBody>({
    ...values,
    retain_repo_versions: toNumberOrUndefined(values.retain_repo_versions),
  });

/** Build the POST body for creating a repository of the selected plugin type. */
export const valuesToCreate = (
  values: Record<string, unknown>,
): RepositoryWriteBody => normalize(values);

/** Build the PATCH body for editing a repository. */
export const valuesToPatch = (
  values: Record<string, unknown>,
): Partial<RepositoryWriteBody> => normalize(values);
