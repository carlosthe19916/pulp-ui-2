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
  Skeleton,
} from "@patternfly/react-core";

import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

import { ToolReadError } from "../../components/ToolReadError";
import { repositorySearchParams } from "./repositorySearchParams";

interface IRepositorySearchResultsProps {
  name: string;
}

/** The repositories whose name contains `name`, read as the signed-in user. */
export const RepositorySearchResults: React.FC<
  IRepositorySearchResultsProps
> = ({ name }) => {
  const { data, isLoading, error } = useRepositoriesListQuery({
    params: repositorySearchParams(name),
  });

  if (isLoading) {
    return <Skeleton screenreaderText="Loading repositories" />;
  }
  if (error) {
    return (
      <ToolReadError
        error={error}
        action="list repositories"
        subject="repositories"
      />
    );
  }

  const repositories = data?.results ?? [];
  const count = data?.count ?? 0;

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">
          {count === 0
            ? `No repositories match "${name}"`
            : `Repositories matching "${name}"`}
        </CardTitle>
      </CardHeader>
      {repositories.length > 0 ? (
        <CardBody>
          <DataList aria-label={`Repositories matching ${name}`} isCompact>
            {repositories.map((repository) => {
              const pulpType = resolvePulpType(repository.pulp_href);
              return (
                <DataListItem key={repository.pulp_href}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="name">
                          <ResourceHrefLink
                            kind="repository"
                            href={repository.pulp_href}
                            label={repository.name}
                          />
                        </DataListCell>,
                        <DataListCell key="type" isFilled={false}>
                          {pulpType ? (
                            <PulpTypeLabel
                              pulpType={pulpType}
                              entity="repository"
                            />
                          ) : null}
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              );
            })}
          </DataList>
          {count > repositories.length ? (
            <Content component="small">
              Showing {repositories.length} of {count}. Ask for a more specific
              name to narrow it down.
            </Content>
          ) : null}
        </CardBody>
      ) : null}
    </Card>
  );
};
