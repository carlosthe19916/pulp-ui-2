import type React from "react";

import {
  Content,
  ContentVariants,
  PaginationVariant,
  Stack,
} from "@patternfly/react-core";

import { ContentSection } from "@app/components/ContentPanelLayout";
import { ListPagination } from "@app/components/ListPagination";

import type { IRelatedPaging } from "./related";

interface IRelatedSectionProps {
  title: string;
  /** How many units this page shows; none shows `emptyText`. */
  shown: number;
  isLoading?: boolean;
  emptyText?: string;
  paging?: IRelatedPaging;
  children: React.ReactNode;
}

/** A section listing the units related to a content unit, with its loading, empty and paged states. */
export const RelatedSection: React.FC<IRelatedSectionProps> = ({
  title,
  shown,
  isLoading,
  emptyText,
  paging,
  children,
}) => (
  <ContentSection title={title}>
    {isLoading || shown === 0 ? (
      <Content component={ContentVariants.small}>
        {isLoading ? `Loading ${title.toLowerCase()}…` : emptyText}
      </Content>
    ) : (
      <Stack hasGutter>
        {children}
        {paging && paging.count > shown && (
          <ListPagination
            variant={PaginationVariant.bottom}
            itemCount={paging.count}
            pagination={paging.pagination}
            onPaginationChange={paging.onPaginationChange}
          />
        )}
      </Stack>
    )}
  </ContentSection>
);
