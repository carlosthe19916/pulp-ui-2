import type React from "react";
import { useState } from "react";

import { Label, Tooltip } from "@patternfly/react-core";

import { EditLabelsModal } from "@app/components/EditLabelsModal";
import { PulpLabelChips } from "@app/components/PulpLabelChips";
import type { IBatchResult } from "@app/queries/utils/settleBatch";
import type { ILabelChanges } from "@app/utils/pulpLabels";

interface IEditablePulpLabelsProps {
  labels?: Record<string, string | null>;
  /** Read-only with a reason (`disabledProps("change")`); Edit labels stays visible. */
  actionProps?: {
    isAriaDisabled?: boolean;
    tooltipProps?: { content: string };
  };
  /** Caller-owned: the save request is in flight. */
  isSaving: boolean;
  /** Caller persists the change (and owns toasts/invalidation); the modal closes on success. */
  onSave: (changes: ILabelChanges) => Promise<IBatchResult>;
}

/**
 * A resource's labels as read-only chips plus an Edit labels control that opens the whole-set
 * editor. Side-effect-free: the caller owns the mutation, toasts and invalidation via `onSave`.
 */
export const EditablePulpLabels: React.FC<IEditablePulpLabelsProps> = ({
  labels,
  actionProps,
  isSaving,
  onSave,
}) => {
  const isDisabled = !!actionProps?.isAriaDisabled;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <PulpLabelChips
        labels={labels}
        addLabelControl={
          isDisabled ? (
            // PF styles an add label disabled only with an onClick, and then drops its
            // pointer events: the span takes the hover.
            <Tooltip content={actionProps?.tooltipProps?.content}>
              <span>
                <Label
                  variant="add"
                  isCompact
                  isDisabled
                  aria-disabled
                  onClick={() => undefined}
                >
                  Edit labels
                </Label>
              </span>
            </Tooltip>
          ) : (
            <Label variant="add" isCompact onClick={() => setIsEditing(true)}>
              Edit labels
            </Label>
          )
        }
      />
      {isEditing && (
        <EditLabelsModal
          labels={labels}
          isSaving={isSaving}
          onSave={onSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};
