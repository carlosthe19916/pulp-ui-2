import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Label,
  PageSection,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type { DistributionResponse } from "@app/client";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { getFieldValue } from "@app/descriptors/formSchema";
import { getDescriptor } from "@app/descriptors/registry";
import { useBrowseDistributionsQuery } from "@app/queries/browse";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/utils/pulpHref";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it.
 */
type DistributionRow = DistributionResponse & {
  pulp_type?: string;
  base_url?: string;
};

export const DistributionBrowser: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");

  const { data, isLoading, error } = useBrowseDistributionsQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
  });

  const distributions = (data?.results ?? []) as DistributionRow[];
  const totalCount = data?.count ?? 0;

  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <EmptyState titleText="Unable to load distributions" headingLevel="h4">
          <EmptyStateBody>
            Something went wrong while loading distributions. Try again later.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Browse Content</Content>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(_e, value) => {
                setNameFilter(value);
                setPage(1);
              }}
              onClear={() => {
                setNameFilter("");
                setPage(1);
              }}
            />
          </ToolbarItem>
          <ToolbarItem variant="pagination">
            <Pagination
              itemCount={totalCount}
              perPage={perPage}
              page={page}
              onSetPage={(_e, p) => setPage(p)}
              onPerPageSelect={(_e, pp) => {
                setPerPage(pp);
                setPage(1);
              }}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {isLoading ? (
        <Spinner aria-label="Loading distributions" />
      ) : distributions.length === 0 ? (
        <EmptyState titleText="No distributions found" headingLevel="h4">
          <EmptyStateBody>
            {nameFilter
              ? "No distributions match the current filter. Try a different search term."
              : "There are no distributions available to browse."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Gallery hasGutter>
          {distributions.map((dist) => {
            const distId = extractIdFromHref(dist.pulp_href ?? "");
            const pulpType = dist.pulp_type;
            const descriptor = pulpType
              ? getDescriptor("distribution", pulpType)
              : undefined;
            const labels = dist.pulp_labels ?? {};
            const labelEntries = Object.entries(labels);
            const canBrowse = !!descriptor && !!distId;

            return (
              <Card isCompact key={dist.pulp_href}>
                <CardHeader>
                  <CardTitle>
                    {canBrowse ? (
                      <Link
                        to="/browse/$distributionId"
                        params={{ distributionId: distId }}
                      >
                        {dist.name}
                      </Link>
                    ) : (
                      dist.name
                    )}
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  {(descriptor?.browseCardFields ?? []).map((field) => {
                    const value = getFieldValue(dist, field.key);
                    if (value === null || value === undefined || value === "") {
                      return null;
                    }
                    return (
                      <Content key={field.key} component={ContentVariants.p}>
                        <strong>{field.label}:</strong> {String(value)}
                      </Content>
                    );
                  })}
                  {!descriptor?.browseCardFields?.length && (
                    <Content component={ContentVariants.p}>
                      <strong>Base path:</strong> {dist.base_path || "—"}
                    </Content>
                  )}
                  {pulpType && (
                    <Content component={ContentVariants.p}>
                      <Label color={descriptor ? "blue" : "grey"} isCompact>
                        {descriptor?.label ?? pulpType}
                      </Label>
                      {!descriptor && (
                        <>
                          {" "}
                          <ReadOnlyBadge pulpType={pulpType} />
                        </>
                      )}
                    </Content>
                  )}
                  {labelEntries.length > 0 && (
                    <Content component={ContentVariants.p}>
                      {labelEntries.map(([key, value]) => (
                        <Label key={key} isCompact className={spacing.mrXs}>
                          {value ? `${key}=${value}` : key}
                        </Label>
                      ))}
                    </Content>
                  )}
                  {!canBrowse && (
                    <Content component={ContentVariants.p}>
                      Browse is available for described file distributions only.
                    </Content>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </Gallery>
      )}

      <Pagination
        itemCount={totalCount}
        perPage={perPage}
        page={page}
        onSetPage={(_e, p) => setPage(p)}
        onPerPageSelect={(_e, pp) => {
          setPerPage(pp);
          setPage(1);
        }}
        variant="bottom"
      />
    </PageSection>
  );
};
