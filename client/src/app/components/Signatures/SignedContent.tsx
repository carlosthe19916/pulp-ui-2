import type React from "react";

import { ContentSection } from "@app/components/ContentPanelLayout";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useContentDetailQuery } from "@app/queries/content";
import { contentUnitLabel } from "@app/utils/contentUnitLabel";

interface ISignedContentProps {
  title: string;
  href?: string | null;
}

/** Links a signature or provenance back to the content unit it is about. */
export const SignedContent: React.FC<ISignedContentProps> = ({
  title,
  href,
}) => {
  const { data } = useContentDetailQuery<object>({ href: href ?? null });
  return (
    <ContentSection title={title}>
      <ResourceHrefLink
        kind="content"
        href={href}
        label={data && href ? contentUnitLabel({ row: data, href }) : undefined}
      />
    </ContentSection>
  );
};
