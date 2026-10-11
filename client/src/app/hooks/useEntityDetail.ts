import { getPlugin } from "@catalog";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import {
  useSuspenseEntityDetailQuery,
  useSuspenseEntityHrefById,
} from "@app/queries/utils/entityCrud";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { IEntityForEdit } from "@app/hooks/useEntityForm";

export interface IEntityDetailEntity extends IEntityForEdit {
  pulp_created?: string;
}

/**
 * Data layer for a content-family detail page: resolve the bare id to its
 * fully-typed `pulp_href` (which embeds plugin+type), look up the plugin, and
 * suspense-load the entity. Presentation/actions live in the detail page itself.
 */
export const useEntityDetail = <T = IEntityDetailEntity>(
  config: IContentFamilyConfig,
  id: string,
) => {
  const domain = useSelectedDomain();
  const { data: href } = useSuspenseEntityHrefById(
    config.rootQueryKey,
    config.family,
    id,
    domain,
  );
  const plugin = getPlugin(resolvePulpType(href) ?? "");
  const { data: entity } = useSuspenseEntityDetailQuery<T>(
    config.rootQueryKey,
    href,
  );
  return { entity, plugin, href };
};
