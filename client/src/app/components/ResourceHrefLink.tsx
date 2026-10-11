import type React from "react";
import { Link, useParams } from "@tanstack/react-router";

import { type EntityType, getPlugin } from "@catalog";
import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

interface IResourceHrefLinkProps {
  kind: EntityType;
  href: string | null | undefined;
  /** Assumed pulp_type when linking into typed detail routes (v1: file.file). */
  pulpType?: string;
  /** Human-readable label; falls back to a short id, then a truncated href. */
  label?: string | null;
  truncateAt?: number;
}

const truncate = (value: string, max: number): string => {
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

/** Link a pulp_href to the matching resource detail when a plugin exists. */
export const ResourceHrefLink: React.FC<IResourceHrefLinkProps> = ({
  kind,
  href,
  pulpType = "file.file",
  label,
  truncateAt = 48,
}) => {
  // Content detail routes are domain-scoped; carry the current domain (or default).
  const { pulpDomain = DEFAULT_PULP_DOMAIN } = useParams({ strict: false });

  if (!href) {
    return "—";
  }

  const resolvedType = resolvePulpType(href) ?? pulpType;
  const plugin = getPlugin(resolvedType);
  const id = extractIdFromHref(href);
  const displayLabel =
    label?.trim() ||
    (id && id.length <= truncateAt ? id : undefined) ||
    truncate(href, truncateAt);

  if (!plugin?.entities[kind] || !id) {
    return displayLabel;
  }

  switch (kind) {
    case "repository":
      return (
        <Link
          to="/content-management/$pulpDomain/repositories/$repoId"
          params={{ pulpDomain, repoId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "remote":
      return (
        <Link
          to="/content-management/$pulpDomain/remotes/$remoteId"
          params={{ pulpDomain, remoteId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "distribution":
      return (
        <Link
          to="/content-management/$pulpDomain/distributions/$distId"
          params={{ pulpDomain, distId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "publication":
      return (
        <Link
          to="/content-management/$pulpDomain/publications/$pubId"
          params={{ pulpDomain, pubId: id }}
        >
          {displayLabel}
        </Link>
      );
    default:
      // "content" has no detail page (removed) — render a plain label.
      return displayLabel;
  }
};
