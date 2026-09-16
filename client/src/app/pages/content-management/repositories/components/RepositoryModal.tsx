import type React from "react";
import { useMemo } from "react";

import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { FileFileRepositoryResponse } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useRemotesListQuery } from "@app/queries/remotes";

import { useRepositoryForm } from "../hooks/useRepositoryForm";

interface IRepositoryModalInnerProps {
  repository?: FileFileRepositoryResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. Only mounted while open (see the
 * wrapper below) so react-hook-form re-initializes on every open.
 */
const RepositoryModalInner: React.FC<IRepositoryModalInnerProps> = ({
  repository,
  onClose,
}) => {
  const { form, isCreate, fields, onSubmit, isSubmitting } = useRepositoryForm({
    repository,
    onClose,
  });
  const { data: remotesData } = useRemotesListQuery({ limit: 100 });

  const remoteOptions = useMemo<ITypeaheadOption[]>(
    () =>
      (remotesData?.results ?? [])
        .filter((remote) => !!remote.pulp_href)
        .map((remote) => ({
          value: remote.pulp_href as string,
          label: remote.name ?? (remote.pulp_href as string),
        })),
    [remotesData?.results],
  );

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={
          isCreate
            ? "Create Repository"
            : `Edit ${repository?.name ?? "repository"}`
        }
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
            idPrefix="repository-form"
            resourceOptions={{ remote: remoteOptions }}
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

interface IRepositoryModalProps {
  isOpen: boolean;
  repository?: FileFileRepositoryResponse;
  onClose: () => void;
}

export const RepositoryModal: React.FC<IRepositoryModalProps> = ({
  isOpen,
  repository,
  onClose,
}) =>
  isOpen ? (
    <RepositoryModalInner repository={repository} onClose={onClose} />
  ) : null;
