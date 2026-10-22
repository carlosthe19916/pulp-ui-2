import type React from "react";

import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import type { ResourceHrefKind } from "@app/components/ResourceHrefLink";
import { useRemoteDetailQuery } from "@app/queries/remotes";
import { useRepositoryDetailQuery } from "@app/queries/repositories";
import { parseRepositoryVersionHref } from "@app/queries/utils/pulpHref";

interface INamedResourceHrefLinkProps {
  kind: ResourceHrefKind;
  href: string | null | undefined;
}

/**
 * `ResourceHrefLink` labelled with the target's name, fetched through the family's
 * detail query (one request, shared cache slot). A repository version is labelled
 * "<repository> · Version N". Meant for single references (detail pages, expanded
 * rows) — not list columns, where it would cost one request per row.
 */
export const NamedResourceHrefLink: React.FC<INamedResourceHrefLinkProps> = ({
  kind,
  href,
}) => {
  const version =
    kind === "repositoryVersion" && href
      ? parseRepositoryVersionHref(href)
      : undefined;
  const repositoryHref = kind === "repository" ? href : version?.repositoryHref;

  const { data: repository } = useRepositoryDetailQuery({
    href: repositoryHref ?? null,
  });
  const { data: remote } = useRemoteDetailQuery({
    href: kind === "remote" ? (href ?? null) : null,
  });

  const name = repository?.name ?? remote?.name;
  const label = name && version ? `${name} · Version ${version.number}` : name;

  return <ResourceHrefLink kind={kind} href={href} label={label} />;
};
