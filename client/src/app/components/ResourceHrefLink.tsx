import type React from "react";

import { Link } from "@tanstack/react-router";

import type { EntityType } from "@catalog";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  extractIdFromHref,
  parseRepositoryVersionHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

export type ResourceHrefKind = EntityType | "content" | "repositoryVersion";

interface IResourceHrefLinkProps {
  /** Which family's detail route to target; `"content"` links the content detail page. */
  kind: ResourceHrefKind;
  href: string | null | undefined;
  /** Human-readable label; falls back to a short id, then a truncated href. */
  label?: string | null;
  truncateAt?: number;
}

const truncate = ({ value, max }: { value: string; max: number }): string =>
  value.length > max ? `${value.slice(0, max)}...` : value;

/**
 * Renders a link (or plain text, when the family has no detail page) for a resource
 * `pulp_href`. The label falls back name → short id → truncated href; a repository
 * version falls back to "Version N".
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
  const version =
    kind === "repositoryVersion" ? parseRepositoryVersionHref(href) : undefined;
  const text =
    label?.trim() ||
    (version ? `Version ${version.number}` : undefined) ||
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

  if (pulpType && version) {
    return (
      <Link
        to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
        params={{
          pulpDomain,
          repositoryType: pulpType,
          repositoryId: extractIdFromHref(version.repositoryHref),
          versionNumber: version.number,
        }}
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

  if (pulpType && kind === "content") {
    return (
      <Link
        to="/content-management/$pulpDomain/content/$contentType/$contentId"
        params={{ pulpDomain, contentType: pulpType, contentId: id }}
      >
        {text}
      </Link>
    );
  }

  return text;
};
