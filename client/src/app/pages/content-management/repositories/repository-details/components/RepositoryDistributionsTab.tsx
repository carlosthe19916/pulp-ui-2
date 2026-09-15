import type React from "react";
import { Link } from "@tanstack/react-router";

import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { DistributionResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

type DistributionRow = DistributionResponse & {
  publication?: string | null;
  repository?: string | null;
};

interface IRepositoryDistributionsTabProps {
  repoHref: string;
}

export const RepositoryDistributionsTab: React.FC<
  IRepositoryDistributionsTabProps
> = ({ repoHref }) => {
  const { data: distributionsData, isLoading: isDistributionsLoading } =
    useDistributionsListQuery(
      {
        repository: repoHref,
        limit: 50,
      },
      { enabled: !!repoHref },
    );

  const distributions = (distributionsData?.results ?? []) as DistributionRow[];

  const distributionColumns = ["Name", "Base path", "Publication"];

  const distributionRows: DataViewTr[] = distributions.map((dist) => {
    const href = dist.pulp_href;
    return {
      id: href,
      row: [
        {
          cell:
            href != null ? (
              <Link
                to="/content-management/distributions/$distId"
                params={{ distId: extractIdFromHref(href) }}
              >
                {dist.name}
              </Link>
            ) : (
              dist.name
            ),
          props: { dataLabel: "Name" },
        },
        { cell: dist.base_path || "—", props: { dataLabel: "Base path" } },
        {
          cell: <ResourceHrefLink kind="publication" href={dist.publication} />,
          props: { dataLabel: "Publication" },
        },
      ],
    };
  });

  const repoDistributionsStates = dataViewBodyStates({
    loading: isDistributionsLoading,
    empty: distributions.length === 0,
    emptyState: "No distributions point at this repository.",
  });

  return (
    <DataView activeState={repoDistributionsStates.activeState}>
      <DataViewTable
        aria-label="Repository distributions table"
        columns={distributionColumns}
        rows={distributionRows}
        bodyStates={repoDistributionsStates.bodyStates}
      />
    </DataView>
  );
};
