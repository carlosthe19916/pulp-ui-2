import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemotesListQuery } from "@app/queries/remotes";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { useVulnReportsListQuery } from "@app/queries/vuln-reports";
import { getScannableRepositoryTypes } from "@catalog";

import { DashboardCard } from "./DashboardCard";

// Count-only reads: `limit: 1`, read `.count`.
const COUNT_PARAMS = { limit: 1, offset: 0, fields: ["pulp_href"] };

/** How many repositories, remotes, distributions, publications (and reports) the user can see. */
export const ContentInventoryCard: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();
  const { plugins: installed } = useApiStatus();
  const canScan = getScannableRepositoryTypes({ installed }).length > 0;

  const repositories = useRepositoriesListQuery({ params: COUNT_PARAMS });
  const remotes = useRemotesListQuery({ params: COUNT_PARAMS });
  const distributions = useDistributionsListQuery({ params: COUNT_PARAMS });
  const publications = usePublicationsListQuery({ params: COUNT_PARAMS });
  const reports = useVulnReportsListQuery({
    params: COUNT_PARAMS,
    options: { enabled: canScan },
  });

  const count = (data?: { count?: number }) => data?.count ?? "—";
  const params = { pulpDomain };

  return (
    <DashboardCard title="Content">
      <DescriptionList
        isCompact
        isHorizontal
        horizontalTermWidthModifier={{ default: "20ch" }}
      >
        <DescriptionListGroup>
          <DescriptionListTerm>
            <Link
              to="/content-management/$pulpDomain/repositories"
              params={params}
            >
              Repositories
            </Link>
          </DescriptionListTerm>
          <DescriptionListDescription>
            {count(repositories.data)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            <Link to="/content-management/$pulpDomain/remotes" params={params}>
              Remotes
            </Link>
          </DescriptionListTerm>
          <DescriptionListDescription>
            {count(remotes.data)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            <Link
              to="/content-management/$pulpDomain/distributions"
              params={params}
            >
              Distributions
            </Link>
          </DescriptionListTerm>
          <DescriptionListDescription>
            {count(distributions.data)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            <Link
              to="/content-management/$pulpDomain/publications"
              params={params}
            >
              Publications
            </Link>
          </DescriptionListTerm>
          <DescriptionListDescription>
            {count(publications.data)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {canScan && (
          <DescriptionListGroup>
            <DescriptionListTerm>
              <Link
                to="/monitoring/$pulpDomain/vulnerability-reports"
                params={params}
              >
                Vulnerability reports
              </Link>
            </DescriptionListTerm>
            <DescriptionListDescription>
              {count(reports.data)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </DashboardCard>
  );
};
