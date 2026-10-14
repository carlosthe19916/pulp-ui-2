import type { EntityType } from "@catalog";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

interface IResourceHrefLinkProps {
  /** Kept for call-site clarity; content entities no longer have detail pages. */
  kind: EntityType;
  href: string | null | undefined;
  /** Human-readable label; falls back to a short id, then a truncated href. */
  label?: string | null;
  truncateAt?: number;
}

const truncate = (value: string, max: number): string => {
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

/**
 * Renders a human-readable label for a resource `pulp_href`. Content families no
 * longer have detail pages, so this is plain text (name → short id → truncated href).
 */
export const ResourceHrefLink = ({
  href,
  label,
  truncateAt = 48,
}: IResourceHrefLinkProps) => {
  if (!href) {
    return "—";
  }

  const id = extractIdFromHref(href);
  return (
    label?.trim() ||
    (id && id.length <= truncateAt ? id : undefined) ||
    truncate(href, truncateAt)
  );
};
