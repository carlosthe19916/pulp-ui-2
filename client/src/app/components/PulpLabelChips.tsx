import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import { type IKeyValue, joinKeyValueAsString } from "@app/utils/pulpLabels";

/** Max rendered width of a label chip before it truncates (with a tooltip). */
const LABEL_MAX_WIDTH = "20ch";

interface IPulpLabelChipsProps {
  labels?: Record<string, string | null>;
  /** Overflow threshold; default 8. */
  numLabels?: number;
  /** Makes each chip clickable (e.g. click-to-filter). */
  onLabelClick?: (label: IKeyValue) => void;
  /** Makes each chip removable (editor draft). */
  onRemove?: (key: string) => void;
  /** Control rendered after the chips (e.g. an Edit labels trigger). */
  addLabelControl?: React.ReactNode;
}

/** The one read-only renderer for a resource's `pulp_labels` as `key=value` chips. */
export const PulpLabelChips: React.FC<IPulpLabelChipsProps> = ({
  labels,
  numLabels = 8,
  onLabelClick,
  onRemove,
  addLabelControl,
}) => {
  const entries = Object.entries(labels ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <LabelGroup
      numLabels={numLabels}
      isCompact
      addLabelControl={addLabelControl}
    >
      {entries.map(([key, value]) => (
        <Label
          key={key}
          isCompact
          textMaxWidth={LABEL_MAX_WIDTH}
          tooltipPosition="top"
          onClick={
            onLabelClick
              ? (event) => {
                  // Don't also trigger an enclosing clickable row.
                  event.stopPropagation();
                  onLabelClick({ key, value });
                }
              : undefined
          }
          onClose={onRemove ? () => onRemove(key) : undefined}
          closeBtnAriaLabel={onRemove ? `Remove label ${key}` : undefined}
        >
          {joinKeyValueAsString({ key, value })}
        </Label>
      ))}
    </LabelGroup>
  );
};
