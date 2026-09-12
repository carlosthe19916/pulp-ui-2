import type React from "react";
import { Link } from "@tanstack/react-router";

import type { ResourceKind } from "@app/descriptors/types";
import { getDescriptor } from "@app/descriptors/registry";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

interface ResourceHrefLinkProps {
  kind: ResourceKind;
  href: string | null | undefined;
  /** Assumed pulp_type when linking into typed detail routes (v1: file.file). */
  pulpType?: string;
  /** Human-readable label; falls back to a short id, then a truncated href. */
  label?: string | null;
  truncateAt?: number;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

/** Link a pulp_href to the matching resource detail when a descriptor exists. */
export const ResourceHrefLink: React.FC<ResourceHrefLinkProps> = ({
  kind,
  href,
  pulpType = "file.file",
  label,
  truncateAt = 48,
}) => {
  if (!href) {
    return "—";
  }

  const resolvedType = resolvePulpType(pulpType, href) ?? pulpType;
  const descriptor = getDescriptor(kind, resolvedType);
  const id = extractIdFromHref(href);
  const displayLabel =
    label?.trim() ||
    (id && id.length <= truncateAt ? id : undefined) ||
    truncate(href, truncateAt);

  if (!descriptor || !id) {
    return displayLabel;
  }

  switch (kind) {
    case "repository":
      return (
        <Link
          to="/content-management/repositories/$repoId"
          params={{ repoId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "remote":
      return (
        <Link
          to="/content-management/remotes/$remoteId"
          params={{ remoteId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "distribution":
      return (
        <Link
          to="/content-management/distributions/$distId"
          params={{ distId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "publication":
      return (
        <Link
          to="/content-management/publications/$pubId"
          params={{ pubId: id }}
        >
          {displayLabel}
        </Link>
      );
    case "content":
      return (
        <Link
          to="/content-management/content/$contentId"
          params={{ contentId: id }}
        >
          {displayLabel}
        </Link>
      );
    default:
      return displayLabel;
  }
};
