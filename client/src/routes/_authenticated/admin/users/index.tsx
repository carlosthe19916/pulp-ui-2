import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UsersPlaceholder,
});

function UsersPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Users</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
