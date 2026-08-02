import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/admin/groups/")({
  component: GroupsPlaceholder,
});

function GroupsPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Groups</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
