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

import { usePlugins } from "@app/context/usePlugins";

export const Dashboard: React.FC = () => {
  const { status, isLoading, error } = usePlugins();

  if (isLoading) {
    return (
      <PageSection>
        <Spinner aria-label="Loading status" />
      </PageSection>
    );
  }

  if (error || !status) {
    return (
      <PageSection>
        <Content component={ContentVariants.h1}>Dashboard</Content>
        <Content component={ContentVariants.p}>
          Failed to load Pulp status.
        </Content>
      </PageSection>
    );
  }

  return (
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
          <Card>
            <CardHeader>
              <CardTitle>Workers</CardTitle>
            </CardHeader>
            <CardBody>
              {status.online_workers.length === 0 ? (
                <Content component={ContentVariants.p}>
                  No online workers
                </Content>
              ) : (
                <DescriptionList isCompact>
                  {status.online_workers.map((w) => (
                    <DescriptionListGroup key={w.name}>
                      <DescriptionListTerm>{w.name}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label color="green" isCompact>
                          Online
                        </Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              )}
            </CardBody>
          </Card>
        </GalleryItem>

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
                  <Link to="/tasks">Tasks</Link>
                </Content>
                <Content component="li">
                  <Link to="/repositories">Repositories</Link>
                </Content>
                <Content component="li">
                  <Link to="/browse">Browse Content</Link>
                </Content>
              </Content>
            </CardBody>
          </Card>
        </GalleryItem>
      </Gallery>
    </PageSection>
  );
};
