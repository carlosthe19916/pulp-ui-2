import { Divider, PageSection } from "@patternfly/react-core";
import { useNavigate } from "@tanstack/react-router";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useDomainsListQuery } from "@app/queries/domains";

import { TypeaheadSelect } from "./TypeaheadSelect";

/**
 * OpenShift-style page-level context selector for the active Pulp domain,
 * rendered as the page's first section above a divider. The selection lives in
 * the URL (`$pulpDomain` path param) — switching navigates to the same route
 * with the new domain, re-scoping every content query. Hidden when the backend
 * has domains disabled.
 */
export const DomainContextSelector = () => {
  const { enabled, name } = useSelectedDomain();
  const navigate = useNavigate();
  const { data, isLoading } = useDomainsListQuery({
    params: {
      limit: 100,
      offset: 0,
      ordering: "name",
    },
  });

  if (!enabled) {
    return null;
  }

  const options = (data?.results ?? []).map((domain) => ({
    value: domain.name,
    label: domain.name,
  }));

  return (
    <>
      <PageSection>
        <TypeaheadSelect
          id="domain-context-selector"
          ariaLabel="Select domain"
          placeholder="Select domain"
          options={options}
          value={name}
          onChange={(value) =>
            void navigate({
              to: ".",
              params: (prev) => ({ ...prev, pulpDomain: value }),
            })
          }
          isLoading={isLoading}
          isToggleFullWidth={false}
        />
      </PageSection>
      <Divider />
    </>
  );
};
