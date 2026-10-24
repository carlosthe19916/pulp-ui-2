import { resolvePulpType } from "@app/queries/utils/pulpHref";
import {
  type EntityType,
  getPlugin,
  type IPlugin,
  type ResourceKind,
} from "@catalog";

/** Per-resource-kind predicate limiting which hrefs an `asyncResource` field offers. */
export type ResourceFilterMap = Partial<
  Record<ResourceKind, (href: string) => boolean>
>;

/**
 * Client-side compatibility predicates for a modal's `asyncResource` pickers, mirroring
 * the backend; kinds without a restriction are absent.
 */
export const buildResourceFilter = ({
  kind,
  plugin,
}: {
  kind: EntityType;
  plugin: IPlugin | undefined;
}): ResourceFilterMap => {
  const filters: ResourceFilterMap = {};

  if (kind === "repository") {
    const compatibleRemoteTypes =
      plugin?.entities.repository?.compatibleRemoteTypes;
    if (compatibleRemoteTypes) {
      filters.remote = (href) =>
        compatibleRemoteTypes.includes(resolvePulpType(href) ?? "");
    }
  }

  if (kind === "publication") {
    const publicationType = plugin?.pulpType;
    if (publicationType) {
      filters.repository = (href) => {
        const repoType = resolvePulpType(href);
        const repoPlugin = repoType ? getPlugin(repoType) : undefined;
        return (
          repoPlugin?.entities.repository?.compatiblePublicationTypes.includes(
            publicationType,
          ) ?? false
        );
      };
    }
  }

  return filters;
};
