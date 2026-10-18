import type React from "react";

import { Link } from "@tanstack/react-router";

import type { EntityType } from "@catalog";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

interface IResourceHrefLinkProps {
  /** Kept for call-site clarity; content entities no longer have detail pages. */
  kind: EntityType;
  href: string | null | undefined;
  /** Human-readable label; falls back to a short id, then a truncated href. */
  label?: string | null;
  truncateAt?: number;
}

const truncate = ({ value, max }: { value: string; max: number }): string =>
  value.length > max ? `${value.slice(0, max)}...` : value;

/**
 * Renders a human-readable label for a resource `pulp_href`. Content families no
 * longer have detail pages, so this is plain text (name → short id → truncated href).
 */
export const ResourceHrefLink: React.FC<IResourceHrefLinkProps> = ({
  kind,
  href,
  label,
  truncateAt = 48,
}) => {
  const { name: pulpDomain } = useSelectedDomain();

  if (!href) {
    return "—";
  }

  const id = extractIdFromHref(href);
  const text =
    label?.trim() ||
    (id && id.length <= truncateAt ? id : undefined) ||
    truncate({ value: href, max: truncateAt });

  const pulpType = resolvePulpType(href);

  if (pulpType && kind === "repository") {
    return (
      <Link
        to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId"
        params={{ pulpDomain, repositoryType: pulpType, repositoryId: id }}
      >
        {text}
      </Link>
    );
  }

  if (pulpType && kind === "remote") {
    return (
      <Link
        to="/content-management/$pulpDomain/remotes/$remoteType/$remoteId"
        params={{ pulpDomain, remoteType: pulpType, remoteId: id }}
      >
        {text}
      </Link>
    );
  }

  return text;
};
