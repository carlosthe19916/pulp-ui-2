import { PageSection, Spinner } from "@patternfly/react-core";

interface IDetailRoutePendingProps {
  label: string;
}

/** Shared route `pendingComponent` for detail pages. */
export const DetailRoutePending = ({ label }: IDetailRoutePendingProps) => (
  <PageSection>
    <Spinner aria-label={label} />
  </PageSection>
);
