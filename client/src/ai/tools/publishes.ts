import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { getPulpType } from "@catalog";

/** Whether the repository's plugin publishes, so a distribution on it serves its latest publication. */
export const publishes = (repositoryHref: string): boolean =>
  (getPulpType(resolvePulpType(repositoryHref) ?? "")?.entities.repository
    ?.compatiblePublicationTypes.length ?? 0) > 0;
