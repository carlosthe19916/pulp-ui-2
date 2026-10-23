import type React from "react";
import { Link } from "@tanstack/react-router";
import prettyBytes from "pretty-bytes";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Gallery,
  GalleryItem,
  Label,
  PageSection,
  Spinner,
} from "@patternfly/react-core";

import { getPlugin } from "@catalog";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { VulnerabilitiesCard } from "./components/VulnerabilitiesCard";
import { WorkersCard } from "./components/WorkersCard";

/** Repository types whose versions can be scanned for vulnerabilities. */
const SCANNABLE_REPOSITORY_TYPES = ["rpm.rpm", "python.python"];

export const Dashboard: React.FC = () => {
  const { status, isLoading, error } = useApiStatus();
  const { name: pulpDomain } = useSelectedDomain();

  return (
    <>
      <DocumentTitle title="Dashboard" />
      {isLoading ? (
        <PageSection>
          <Spinner aria-label="Loading status" />
        </PageSection>
      ) : error || !status ? (
        <PageSection>
          <Content component={ContentVariants.h1}>Dashboard</Content>
          <Content component={ContentVariants.p}>
            Failed to load Pulp status.
          </Content>
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Dashboard</Content>
          <Gallery hasGutter minWidths={{ default: "300px" }}>
            <GalleryItem>
              <Card>
                <CardHeader>
                  <CardTitle>Plugins &amp; Versions</CardTitle>
                </CardHeader>
                <CardBody>
                  <DescriptionList isCompact>
                    {status.versions.map((v) => (
                      <DescriptionListGroup key={v.component}>
                        <DescriptionListTerm>{v.component}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label isCompact>{v.version}</Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ))}
                  </DescriptionList>
                </CardBody>
              </Card>
            </GalleryItem>

            <GalleryItem>
              <WorkersCard />
            </GalleryItem>

            {SCANNABLE_REPOSITORY_TYPES.some((type) =>
              getPlugin(type)?.isAvailable(status.versions),
            ) && (
              <GalleryItem>
                <VulnerabilitiesCard pulpDomain={pulpDomain} />
              </GalleryItem>
            )}

            {status.storage && (
              <GalleryItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Storage</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Total</DescriptionListTerm>
                        <DescriptionListDescription>
                          {status.storage.total != null
                            ? prettyBytes(status.storage.total)
                            : "N/A"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Used</DescriptionListTerm>
                        <DescriptionListDescription>
                          {status.storage.used != null
                            ? prettyBytes(status.storage.used)
                            : "N/A"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Free</DescriptionListTerm>
                        <DescriptionListDescription>
                          {status.storage.free != null
                            ? prettyBytes(status.storage.free)
                            : "N/A"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </GalleryItem>
            )}

            <GalleryItem>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardBody>
                  <Content component="ul">
                    <Content component="li">
                      <Link
                        to="/monitoring/$pulpDomain/tasks"
                        params={{ pulpDomain }}
                      >
                        Tasks
                      </Link>
                    </Content>
                    <Content component="li">
                      <Link
                        to="/content-management/$pulpDomain/repositories"
                        params={{ pulpDomain }}
                      >
                        Repositories
                      </Link>
                    </Content>
                  </Content>
                </CardBody>
              </Card>
            </GalleryItem>
          </Gallery>
        </PageSection>
      )}
    </>
  );
};
