import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/repositories/")({
  component: RepositoriesPlaceholder,
});

function RepositoriesPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Repositories</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
