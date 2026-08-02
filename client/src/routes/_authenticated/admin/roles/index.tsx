import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/admin/roles/")({
  component: RolesPlaceholder,
});

function RolesPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Roles</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
