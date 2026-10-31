import type React from "react";

import type { AnsibleAnsibleNamespaceMetadataResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  type IContentPanelProps,
  LinkList,
  links,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

/** Galaxy namespace page: the publisher, contact and links. */
export const AnsibleNamespaceContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleAnsibleNamespaceMetadataResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          subtitle={data?.company}
          summary={data?.description}
        />
      }
      aside={
        <>
          <LinkList
            links={links(
              Object.fromEntries(
                (data?.links ?? []).map((link) => [link.name, link.url]),
              ),
            )}
          />
          <FactList title="Contact" items={facts({ Email: data?.email })} />
        </>
      }
    >
      {data?.resources ? (
        <ContentSection title="Resources">{data.resources}</ContentSection>
      ) : null}
    </ContentPanelLayout>
  );
};
