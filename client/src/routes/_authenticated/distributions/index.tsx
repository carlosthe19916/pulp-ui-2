import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/distributions/")({
  component: DistributionsPlaceholder,
});

function DistributionsPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Distributions</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
