import { Content, ContentVariants, PageSection } from "@patternfly/react-core";

export function ComingSoon({ title }: { title: string }) {
  return (
    <PageSection>
      <Content component={ContentVariants.h1}>{title}</Content>
      <Content component={ContentVariants.p}>Coming in a future phase.</Content>
    </PageSection>
  );
}
