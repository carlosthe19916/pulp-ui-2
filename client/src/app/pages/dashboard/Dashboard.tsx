import type React from "react";

import {
  Content,
  ContentVariants,
  Grid,
  GridItem,
  PageSection,
  Stack,
  Title,
} from "@patternfly/react-core";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { ContentInventoryCard } from "./components/ContentInventoryCard";
import { DetailsCard } from "./components/DetailsCard";
import { FailedTasksCard } from "./components/FailedTasksCard";
import { RecentTasksCard } from "./components/RecentTasksCard";
import { StorageCard } from "./components/StorageCard";
import { SystemHealthCard } from "./components/SystemHealthCard";
import { TaskActivityCard } from "./components/TaskActivityCard";
import { TaskTrendCard } from "./components/TaskTrendCard";

/** Instance health and details, then the selected domain's tasks and content (ADR 0015). */
export const Dashboard: React.FC = () => {
  const { name: pulpDomain, enabled: domainsEnabled } = useSelectedDomain();

  return (
    <>
      <DocumentTitle title="Dashboard" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Dashboard</Content>
        <Content component={ContentVariants.p}>
          How this Pulp is running, and what is happening in{" "}
          {domainsEnabled ? `the ${pulpDomain} domain` : "it"}. Counts include
          only what you have permission to see.
        </Content>
      </PageSection>
      <PageSection aria-labelledby="dashboard-instance">
        <Stack hasGutter>
          <Title headingLevel="h2" id="dashboard-instance">
            Pulp instance
          </Title>
          <Grid hasGutter>
            <GridItem span={12} lg={8}>
              <SystemHealthCard />
            </GridItem>
            <GridItem span={12} md={6} lg={4}>
              <StorageCard />
            </GridItem>
            <GridItem span={12} md={6} lg={5}>
              <DetailsCard />
            </GridItem>
            <GridItem span={12} lg={7}>
              <RecentTasksCard />
            </GridItem>
          </Grid>
        </Stack>
      </PageSection>
      <PageSection aria-labelledby="dashboard-domain">
        <Stack hasGutter>
          <Title headingLevel="h2" id="dashboard-domain">
            {domainsEnabled ? `Domain ${pulpDomain}` : "Tasks and content"}
          </Title>
          <Grid hasGutter>
            <GridItem span={12} md={6} lg={4}>
              <TaskActivityCard />
            </GridItem>
            <GridItem span={12} lg={8}>
              <TaskTrendCard />
            </GridItem>
            <GridItem span={12} md={6} lg={4}>
              <ContentInventoryCard />
            </GridItem>
            <GridItem span={12} lg={8}>
              <FailedTasksCard />
            </GridItem>
          </Grid>
        </Stack>
      </PageSection>
    </>
  );
};
