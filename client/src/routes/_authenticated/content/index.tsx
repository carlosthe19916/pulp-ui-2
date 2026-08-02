import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/content/")({
  component: ContentPlaceholder,
});

function ContentPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Content</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
