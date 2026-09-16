import type React from "react";
import { useMemo, useState } from "react";

import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { FileFileDistributionResponse } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useAllPublicationsListQuery } from "@app/queries/publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { useDistributionForm } from "../hooks/useDistributionForm";

interface IDistributionModalInnerProps {
  distribution?: FileFileDistributionResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. Only mounted while open (see the
 * wrapper below) so react-hook-form re-initializes on every open.
 */
const DistributionModalInner: React.FC<IDistributionModalInnerProps> = ({
  distribution,
  onClose,
}) => {
  const { form, isCreate, fields, onSubmit, isSubmitting } =
    useDistributionForm({ distribution, onClose });
  const [repoSearch, setRepoSearch] = useState("");
  const debouncedRepoSearch = useDebouncedValue(repoSearch);
  const { data: repositoriesData, isLoading: isReposLoading } =
    useRepositoriesListQuery({
      limit: 20,
      name__icontains: debouncedRepoSearch || undefined,
    });
  // Publications have no server-side name filter, so fetch them all for the
  // static picker.
  const { data: publicationsData } = useAllPublicationsListQuery();

  const repositoryOptions = useMemo<ITypeaheadOption[]>(
    () =>
      (repositoriesData?.results ?? [])
        .filter((repo) => !!repo.pulp_href)
        .map((repo) => ({
          value: repo.pulp_href as string,
          label: repo.name ?? (repo.pulp_href as string),
        })),
    [repositoriesData?.results],
  );

  const publicationOptions = useMemo<ITypeaheadOption[]>(
    () =>
      (publicationsData?.results ?? [])
        .filter((pub) => !!pub.pulp_href)
        .map((pub) => ({
          value: pub.pulp_href as string,
          label: `Publication ${extractIdFromHref(pub.pulp_href as string)}`,
        })),
    [publicationsData?.results],
  );

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create Distribution" : `Edit ${distribution?.name}`}
      />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <DescriptorFormFields
            fields={fields}
            control={form.control}
            idPrefix="distribution-form"
            resourceOptions={{
              repository: repositoryOptions,
              publication: publicationOptions,
            }}
            resourceSearch={{
              repository: {
                onFilterChange: setRepoSearch,
                isLoading: isReposLoading,
              },
            }}
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          {isCreate ? "Create" : "Save"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

interface IDistributionModalProps {
  isOpen: boolean;
  distribution?: FileFileDistributionResponse;
  onClose: () => void;
}

export const DistributionModal: React.FC<IDistributionModalProps> = ({
  isOpen,
  distribution,
  onClose,
}) =>
  isOpen ? (
    <DistributionModalInner distribution={distribution} onClose={onClose} />
  ) : null;
