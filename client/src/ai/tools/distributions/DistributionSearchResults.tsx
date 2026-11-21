import type React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  HelperText,
  HelperTextItem,
  Skeleton,
} from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import {
  useDistributionDetailQuery,
  useDistributionsListQuery,
} from "@app/queries/distributions";

import { ToolReadError } from "../../components/ToolReadError";
import { publishes } from "../publishes";
import {
  distributionSearchParams,
  needsDetail,
  publicationOf,
} from "./distributionSearchParams";

interface IServingProps {
  distribution: DistributionResponse;
}

/** What a distribution serves, linked; a warning when it serves nothing. */
const Serving: React.FC<IServingProps> = ({ distribution }) => {
  const { data: detail, isLoading } = useDistributionDetailQuery({
    href: needsDetail(distribution) ? (distribution.pulp_href ?? null) : null,
  });

  if (distribution.repository) {
    return (
      <>
        {publishes(distribution.repository)
          ? "Latest publication of"
          : "Latest version of"}{" "}
        <NamedResourceHrefLink
          kind="repository"
          href={distribution.repository}
        />
      </>
    );
  }
  if (distribution.repository_version) {
    return (
      <NamedResourceHrefLink
        kind="repositoryVersion"
        href={distribution.repository_version}
      />
    );
  }
  if (isLoading) {
    return <Skeleton width="10rem" screenreaderText="Loading what it serves" />;
  }
  const publication = publicationOf(detail);
  return publication ? (
    <>
      Publication <ResourceHrefLink kind="publication" href={publication} />
    </>
  ) : (
    <HelperText>
      <HelperTextItem variant="warning">
        Serves nothing: it has no repository, version or publication
      </HelperTextItem>
    </HelperText>
  );
};

interface IDistributionSearchResultsProps {
  basePath: string;
}

/** The distributions whose base path contains `basePath`, with their URL and source. */
export const DistributionSearchResults: React.FC<
  IDistributionSearchResultsProps
> = ({ basePath }) => {
  const { data, isLoading, error } = useDistributionsListQuery({
    params: distributionSearchParams(basePath),
  });

  if (isLoading) {
    return <Skeleton screenreaderText="Loading distributions" />;
  }
  if (error) {
    return (
      <ToolReadError
        error={error}
        action="list distributions"
        subject="distributions"
      />
    );
  }

  const distributions = data?.results ?? [];
  const count = data?.count ?? 0;
  const title =
    count === 0
      ? `No distributions match "${basePath}"`
      : `Distributions matching "${basePath}"`;

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">{title}</CardTitle>
      </CardHeader>
      {distributions.length > 0 ? (
        <CardBody>
          <DataList aria-label={title} isCompact>
            {distributions.map((distribution) => (
              <DataListItem key={distribution.pulp_href}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="distribution">
                        <Flex
                          direction={{ default: "column" }}
                          spaceItems={{ default: "spaceItemsXs" }}
                        >
                          <ResourceHrefLink
                            kind="distribution"
                            href={distribution.pulp_href}
                            label={distribution.name}
                          />
                          <ContentUrlLink distribution={distribution} />
                          <div>
                            <Serving distribution={distribution} />
                          </div>
                        </Flex>
                      </DataListCell>,
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            ))}
          </DataList>
          {count > distributions.length ? (
            <Content component="small">
              Showing {distributions.length} of {count}. Ask for a more specific
              path to narrow it down.
            </Content>
          ) : null}
        </CardBody>
      ) : null}
    </Card>
  );
};
