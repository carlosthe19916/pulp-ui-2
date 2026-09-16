import type React from "react";

import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { FileFileRemoteResponse } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";

import { useRemoteForm } from "../hooks/useRemoteForm";

interface IRemoteModalInnerProps {
  remote?: FileFileRemoteResponse;
  onClose: () => void;
}

/** Only mounted while open, so react-hook-form re-initializes on each open. */
const RemoteModalInner: React.FC<IRemoteModalInnerProps> = ({
  remote,
  onClose,
}) => {
  const { form, isCreate, fields, onSubmit, isSubmitting } = useRemoteForm({
    remote,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create Remote" : `Edit ${remote?.name}`}
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
            idPrefix="remote-form"
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

interface IRemoteModalProps {
  isOpen: boolean;
  remote?: FileFileRemoteResponse;
  onClose: () => void;
}

export const RemoteModal: React.FC<IRemoteModalProps> = ({
  isOpen,
  remote,
  onClose,
}) => (isOpen ? <RemoteModalInner remote={remote} onClose={onClose} /> : null);
