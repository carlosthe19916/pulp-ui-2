import type React from "react";

import { useContentGuardDetailQuery } from "@app/queries/content-guards";
import { useSigningServiceDetailQuery } from "@app/queries/signing-services";

/** Resources without a page of their own, so they're named, not linked. */
export type NamedOnlyKind = "signingService" | "contentGuard";

interface IResourceNameProps {
  kind: NamedOnlyKind;
  href: string | null | undefined;
}

/**
 * A supporting resource's name as plain text, read through its detail query; its href while
 * the name loads or when it can't be read.
 */
export const ResourceName: React.FC<IResourceNameProps> = ({ kind, href }) => {
  const { data: signingService } = useSigningServiceDetailQuery({
    href: kind === "signingService" ? (href ?? "") : "",
  });
  const { data: contentGuard } = useContentGuardDetailQuery({
    href: kind === "contentGuard" ? (href ?? "") : "",
  });

  if (!href) return <>—</>;
  const name =
    kind === "signingService" ? signingService?.name : contentGuard?.name;
  return <>{name ?? href}</>;
};
