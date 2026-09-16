import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { RoleResponse } from "@app/client";

import { useRoleForm } from "../hooks/useRoleForm";
import { RoleForm } from "./RoleForm";

interface IRoleModalInnerProps {
  role?: RoleResponse;
  onClose: () => void;
}

/** Only mounted while open so react-hook-form re-initializes on every open. */
const RoleModalInner: React.FC<IRoleModalInnerProps> = ({ role, onClose }) => {
  const { form, isCreate, onSubmit, isSubmitting } = useRoleForm({
    role,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create Role" : `Edit Role: ${role?.name}`}
      />
      <ModalBody>
        <RoleForm form={form} isCreate={isCreate} onSubmit={onSubmit} />
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

interface IRoleModalProps {
  isOpen: boolean;
  role?: RoleResponse;
  onClose: () => void;
}

/** Passing a `role` selects edit mode; omitting it selects create mode. */
export const RoleModal: React.FC<IRoleModalProps> = ({
  isOpen,
  role,
  onClose,
}) => (isOpen ? <RoleModalInner role={role} onClose={onClose} /> : null);
