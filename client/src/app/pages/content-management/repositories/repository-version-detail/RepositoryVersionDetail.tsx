import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  PageSection,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { useRepositoryDetailQuery } from "@app/queries/repositories";
import { useSuspenseRepositoryVersionDetailQuery } from "@app/queries/repositories";
import { buildRepositoryHref } from "@app/queries/repositories";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { ContentDrawerPanel } from "./components/ContentDrawerPanel";
import { VersionContentList } from "./components/VersionContentList";

interface IRepositoryVersionDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
  versionNumber: string;
}

export const RepositoryVersionDetail: React.FC<
  IRepositoryVersionDetailProps
> = ({ pulpDomain, pulpType, id, versionNumber }) => {
  const domain = useSelectedDomain();
  const { data: version } = useSuspenseRepositoryVersionDetailQuery({
    pulpType,
    id,
    number: versionNumber,
  });

  // Repo name for the breadcrumb (cached from navigation; optional).
  const { data: repository } = useRepositoryDetailQuery({
    href: buildRepositoryHref(pulpType, id, domain),
  });
  const repositoryName = repository?.name ?? "Repository";

  const [selectedHref, setSelectedHref] = useState<string | null>(null);

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
        <Drawer isExpanded={selectedHref != null} isInline>
          <DrawerContent
            panelContent={
              <ContentDrawerPanel
                href={selectedHref}
                onClose={() => setSelectedHref(null)}
              />
            }
          >
            <DrawerContentBody>
              <VersionContentList
                versionHref={version.pulp_href ?? ""}
                summary={version.content_summary}
                selectedHref={selectedHref ?? undefined}
                onSelect={setSelectedHref}
              />
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </PageSection>
    </>
  );
};
