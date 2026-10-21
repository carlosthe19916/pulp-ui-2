import type React from "react";

import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { TasksTable } from "@app/components/TasksTable";

export const TaskList: React.FC = () => {
  return (
    <>
      <DocumentTitle title="Tasks" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Tasks</Content>
      </PageSection>
      <PageSection>
        <TasksTable showPurge />
      </PageSection>
    </>
  );
};
