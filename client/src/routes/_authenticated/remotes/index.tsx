import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/remotes/")({
  component: RemotesPlaceholder,
});

function RemotesPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Remotes</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
