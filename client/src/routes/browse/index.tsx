import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/browse/")({
  component: ContentBrowserPlaceholder,
});

function ContentBrowserPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Content Browser</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
