import { useState } from "react";

import { Divider, PageSection } from "@patternfly/react-core";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { domainsListQueryOptions } from "@app/queries/domains";

import { TypeaheadSelect } from "./TypeaheadSelect";

/** One page of options per keystroke — the picker is a search, not a full list. */
const PAGE_SIZE = 10;

/**
 * OpenShift-style page-level context selector for the active Pulp domain,
 * rendered as the page's first section above a divider. The selection lives in
 * the URL (`$pulpDomain` path param) — switching navigates to the same route
 * with the new domain, re-scoping every content query. Hidden when the backend
 * has domains disabled.
 *
 * Deployments can have hundreds of domains, so options are searched server-side:
 * nothing is fetched until the dropdown opens, then a page of at most
 * {@link PAGE_SIZE} matches is loaded and refined (debounced) as the user types.
 * The selected value is the domain name itself, so it renders correctly even when
 * it falls outside the current search page.
 */
export const DomainContextSelector = () => {
  const { enabled, name } = useSelectedDomain();
  const navigate = useNavigate();
  const apiDomain = useDefaultDomain();

  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  const { data, isFetching } = useQuery({
    ...domainsListQueryOptions({
      apiDomain,
      params: {
        limit: PAGE_SIZE,
        offset: 0,
        ordering: "name",
        name__icontains: debouncedTerm || undefined,
      },
    }),
    enabled: enabled && isOpen,
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
          onFilterChange={setTerm}
          onOpenChange={setIsOpen}
          isLoading={isFetching}
          selectedLabel={name}
          isToggleFullWidth={false}
        />
      </PageSection>
      <Divider />
    </>
  );
};
