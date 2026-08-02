import { createFileRoute } from "@tanstack/react-router";
import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export const Route = createFileRoute("/_authenticated/admin/signing-services/")(
  {
    component: SigningServicesPlaceholder,
  },
);

function SigningServicesPlaceholder() {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Signing Services</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
