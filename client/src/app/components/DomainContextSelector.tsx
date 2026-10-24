import type React from "react";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Divider, PageSection } from "@patternfly/react-core";

import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { domainsListQueryOptions } from "@app/queries/domains";

import { TypeaheadSelect } from "./TypeaheadSelect";

/**
 * Page-level selector for the active Pulp domain, kept in the URL (`$pulpDomain`) so
 * switching re-scopes every content query. Hidden when domains are disabled.
 */
export const DomainContextSelector: React.FC = () => {
  const { enabled, name } = useSelectedDomain();
  const navigate = useNavigate();
  const apiDomain = useDefaultDomain();

  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  // Deployments can have hundreds of domains: search server-side, only while open.
  const { data, isFetching } = useQuery({
    ...domainsListQueryOptions({
      apiDomain,
      params: {
        limit: DROPDOWN_PAGE_SIZE,
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
          // The value is the name itself, so it shows even outside the search page.
          selectedLabel={name}
          isToggleFullWidth={false}
        />
      </PageSection>
      <Divider />
    </>
  );
};
