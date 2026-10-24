import type React from "react";
import type { ReactNode } from "react";

import {
  Bullseye,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";

interface IEntityModalShellProps {
  title: string;
  /** Wizard uses a large modal with its own header; plain uses a medium modal. */
  variant: "wizard" | "plain";
  /** Edit mode: the full typed entity is still loading. */
  isDetailLoading: boolean;
  isCreate: boolean;
  onClose: () => void;
  /**
   * The form body — a plain `<Form>` body or an `EntityWizardBody`. The caller must
   * `key` it (e.g. by selected type / entity href) so it remounts and re-initializes
   * when the create type or edited entity changes.
   */
  children: ReactNode;
}

/**
 * Shared modal chrome (edit-prefetch spinner, plain vs wizard shell) for every
 * content-family create/edit dialog; the caller supplies the body.
 */
export const EntityModalShell: React.FC<IEntityModalShellProps> = ({
  title,
  variant,
  isDetailLoading,
  isCreate,
  onClose,
  children,
}) => {
  const useWizard = variant === "wizard";

  if (!isCreate && isDetailLoading) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        variant={useWizard ? "large" : "medium"}
        aria-label={title}
      >
        <ModalHeader title={title} />
        <ModalBody>
          <Bullseye>
            <Spinner aria-label="Loading" />
          </Bullseye>
        </ModalBody>
      </Modal>
    );
  }

  if (useWizard) {
    // No Modal `onClose` here: it would render a second close button next to the
    // WizardHeader's. Escape is wired via `onEscapePress` instead.
    return (
      <Modal isOpen onEscapePress={onClose} variant="large" aria-label={title}>
        {children}
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader title={title} />
      {children}
    </Modal>
  );
};
