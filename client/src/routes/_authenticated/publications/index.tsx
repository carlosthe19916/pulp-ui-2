import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/publications/")({
  component: PublicationsPlaceholder,
});

function PublicationsPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Publications</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
