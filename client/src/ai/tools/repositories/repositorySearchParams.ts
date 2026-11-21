import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import type { IRepositoryListParams } from "@app/queries/repositories";

/** A server-side name search sized like a picker, shared by the tool and its card. */
export const repositorySearchParams = (
  name: string,
): IRepositoryListParams => ({
  limit: DROPDOWN_PAGE_SIZE,
  offset: 0,
  name__icontains: name,
  ordering: "name",
});
