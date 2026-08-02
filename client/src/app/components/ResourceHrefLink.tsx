import type React from "react";
import { Link } from "@tanstack/react-router";

import type { ResourceKind } from "@app/descriptors/types";
import { getDescriptor } from "@app/descriptors/registry";
import { extractIdFromHref } from "@app/utils/pulpHref";

interface ResourceHrefLinkProps {
  kind: ResourceKind;
  href: string | null | undefined;
  /** Assumed pulp_type when linking into typed detail routes (v1: file.file). */
  pulpType?: string;
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
  truncateAt = 48,
}) => {
  if (!href) {
    return "—";
  }

  const descriptor = getDescriptor(kind, pulpType);
  const id = extractIdFromHref(href);
  const label = truncate(href, truncateAt);

  if (!descriptor || !id) {
    return label;
  }

  switch (kind) {
    case "repository":
      return (
        <Link to="/repositories/$repoId" params={{ repoId: id }}>
          {label}
        </Link>
      );
    case "remote":
      return (
        <Link to="/remotes/$remoteId" params={{ remoteId: id }}>
          {label}
        </Link>
      );
    case "distribution":
      return (
        <Link to="/distributions/$distId" params={{ distId: id }}>
          {label}
        </Link>
      );
    case "publication":
      return (
        <Link to="/publications/$pubId" params={{ pubId: id }}>
          {label}
        </Link>
      );
    case "content":
      return (
        <Link to="/content/$contentId" params={{ contentId: id }}>
          {label}
        </Link>
      );
    default:
      return label;
  }
};
