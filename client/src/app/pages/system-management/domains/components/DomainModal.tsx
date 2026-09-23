import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { DomainResponse } from "@app/client";

import { useDomainForm } from "../hooks/useDomainForm";
import { DomainForm } from "./DomainForm";

interface IDomainModalInnerProps {
  domain?: DomainResponse;
  onClose: () => void;
}

/** Only mounted while open so react-hook-form re-initializes on every open. */
const DomainModalInner: React.FC<IDomainModalInnerProps> = ({
  domain,
  onClose,
}) => {
  const { form, isCreate, onSubmit, isSubmitting } = useDomainForm({
    domain,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create Domain" : `Edit ${domain?.name}`}
      />
      <ModalBody>
        <DomainForm form={form} onSubmit={onSubmit} formId="domain-form" />
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="domain-form"
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

interface IDomainModalProps {
  isOpen: boolean;
  domain?: DomainResponse;
  onClose: () => void;
}

/** Passing a `domain` selects edit mode; omitting it selects create mode. */
export const DomainModal: React.FC<IDomainModalProps> = ({
  isOpen,
  domain,
  onClose,
}) => (isOpen ? <DomainModalInner domain={domain} onClose={onClose} /> : null);
