import type React from "react";
import { useState } from "react";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useRepositoryVersionsListQuery } from "@app/queries/repositories";

interface IVersionSelectProps {
  id: string;
  /** Placeholder / aria label (e.g. "Version", "Base version"). */
  label: string;
  /** The repository whose versions to list; empty disables the select. */
  repositoryHref: string;
  /** Selected repository-version href. */
  value: string;
  onChange: (versionHref: string) => void;
}

/**
 * Async typeahead over a repository's versions (latest first, exact `number` search);
 * fetches only while open and once a repository is chosen.
 */
export const VersionSelect: React.FC<IVersionSelectProps> = ({
  id,
  label,
  repositoryHref,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  // Version numbers are integers with an exact `number` filter (no substring), so a numeric
  // search term filters by exact number; non-numeric text falls back to the latest page.
  const parsed = Number(debouncedTerm);
  const numberFilter =
    debouncedTerm.trim() !== "" && Number.isInteger(parsed)
      ? parsed
      : undefined;

  const { data, isFetching } = useRepositoryVersionsListQuery({
    repositoryHref,
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "-number",
      number: numberFilter,
    },
    options: { enabled: isOpen },
  });

  const options = (data?.results ?? []).map((version) => ({
    value: version.pulp_href ?? "",
    label: `Version ${version.number}`,
  }));

  return (
    <TypeaheadSelect
      id={id}
      ariaLabel={label}
      placeholder={label}
      options={options}
      value={value}
      onChange={onChange}
      onFilterChange={setTerm}
      onOpenChange={setIsOpen}
      isLoading={isFetching}
      isDisabled={!repositoryHref}
      isToggleFullWidth={false}
    />
  );
};
