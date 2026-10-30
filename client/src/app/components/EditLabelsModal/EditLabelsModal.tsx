import type React from "react";

import {
  Button,
  Content,
  ContentVariants,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { PulpLabelChips } from "@app/components/PulpLabelChips";
import type { IBatchResult } from "@app/queries/utils/settleBatch";
import type { ILabelChanges } from "@app/utils/pulpLabels";

import { AddLabelField } from "./AddLabelField";
import { useLabelsDraft } from "./useLabelsDraft";

interface IEditLabelsModalProps {
  labels?: Record<string, string | null>;
  title?: string;
  /** Caller-owned: the save request is in flight. */
  isSaving: boolean;
  /** Caller persists the change; the modal closes on success (when nothing failed). */
  onSave: (changes: ILabelChanges) => Promise<IBatchResult>;
  onClose: () => void;
}

/**
 * Controlled editor for a resource's whole label set: chips for the current labels (removable)
 * and a `key=value` field to add more. Owns only the editing UI and the close-on-success
 * decision — the caller persists `onSave(changes)` and shows toasts. Mount fresh per open
 * (`{open && <EditLabelsModal/>}`) so the draft resets to the resource's labels.
 */
export const EditLabelsModal: React.FC<IEditLabelsModalProps> = ({
  labels,
  title = "Edit labels",
  isSaving,
  onSave,
  onClose,
}) => {
  const { draft, add, remove, diff, isDirty } = useLabelsDraft(labels ?? {});
  const hasLabels = Object.keys(draft).length > 0;

  const handleSave = async () => {
    try {
      const result = await onSave(diff);
      if (result.failed.length === 0) onClose();
    } catch {
      // The caller surfaces the error (toast); keep the modal open for a retry.
    }
  };

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title={title} />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <FormGroup label="Labels" fieldId="edit-labels-group">
              {hasLabels ? (
                <PulpLabelChips
                  labels={draft}
                  numLabels={10}
                  onRemove={remove}
                />
              ) : (
                <Content component={ContentVariants.small}>
                  No labels yet.
                </Content>
              )}
            </FormGroup>
          </StackItem>
          <StackItem>
            <AddLabelField onAdd={add} />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          isLoading={isSaving}
          isDisabled={isSaving || !isDirty}
        >
          Save
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
