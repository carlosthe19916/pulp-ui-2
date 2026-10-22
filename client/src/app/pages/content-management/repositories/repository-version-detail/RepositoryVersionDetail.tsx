import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { RepositoryContent } from "@app/components/RepositoryContent";
import {
  useRepositoryDetailQuery,
  useSuspenseRepositoryVersionDetailQuery,
} from "@app/queries/repositories";

interface IRepositoryVersionDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
  versionNumber: string;
  repositoryHref: string;
  versionHref: string;
}

export const RepositoryVersionDetail: React.FC<
  IRepositoryVersionDetailProps
> = ({
  pulpDomain,
  pulpType,
  id,
  versionNumber,
  repositoryHref,
  versionHref,
}) => {
  const { data: version } = useSuspenseRepositoryVersionDetailQuery({
    href: versionHref,
  });

  // Repo name for the breadcrumb (cached from navigation; optional).
  const { data: repository } = useRepositoryDetailQuery({
    href: repositoryHref,
  });
  const repositoryName = repository?.name ?? "Repository";

  const title = `Version ${version.number ?? versionNumber}`;

  return (
    <>
      <DocumentTitle title={`${repositoryName} · ${title}`} />
      <PageHeader
        title={title}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/repositories"
                params={{ pulpDomain }}
              >
                Repositories
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId"
                params={{
                  pulpDomain,
                  repositoryType: pulpType,
                  repositoryId: id,
                }}
              >
                {repositoryName}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
        }
      />

      <PageSection>
        <RepositoryContent
          repositoryHref={repositoryHref}
          repositoryType={pulpType}
          versionHref={version.pulp_href ?? ""}
          summary={version.content_summary}
        />
      </PageSection>
    </>
  );
};
