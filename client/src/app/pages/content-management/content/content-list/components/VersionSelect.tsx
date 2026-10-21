import type React from "react";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { getPlugin } from "@catalog";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { repositoryVersionsListQueryOptions } from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

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

/** One page of versions per keystroke — the picker is a search, not a full list. */
const PAGE_SIZE = 10;

/**
 * Async typeahead over a repository's versions (there can be far more than a page). Lists the
 * latest versions (highest number first) and, as the user types a version number, filters
 * server-side by exact `number`. Fetches only while open and only once a repository is chosen.
 * Mirrors `AsyncResourceSelect` / `useResourceSearch`, keyed by version href.
 */
export const VersionSelect: React.FC<IVersionSelectProps> = ({
  id,
  label,
  repositoryHref,
  value,
  onChange,
}) => {
  const domain = useSelectedDomain();
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue({ value: term });

  const pulpType = repositoryHref ? resolvePulpType(repositoryHref) : undefined;
  const apiPath = pulpType
    ? getPlugin(pulpType)?.entities.repository?.apiPath
    : undefined;
  const repositoryId = repositoryHref ? extractIdFromHref(repositoryHref) : "";

  // Version numbers are integers with an exact `number` filter (no substring), so a numeric
  // search term filters by exact number; non-numeric text falls back to the latest page.
  const parsed = Number(debouncedTerm);
  const numberFilter =
    debouncedTerm.trim() !== "" && Number.isInteger(parsed)
      ? parsed
      : undefined;

  const { data, isFetching } = useQuery({
    ...repositoryVersionsListQueryOptions({
      apiPath,
      id: repositoryId,
      domain,
      params: { limit: PAGE_SIZE, ordering: "-number", number: numberFilter },
    }),
    enabled: isOpen && !!apiPath && !!repositoryId,
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
