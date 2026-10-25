import type React from "react";
import { useState } from "react";

import {
  Label,
  LabelGroup,
  TextInputGroup,
  TextInputGroupMain,
} from "@patternfly/react-core";

import { addPermission } from "./permissionList";

interface IPermissionInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Free-text permission codenames (`core.view_task`) as removable labels. Pulp has no
 * endpoint listing permissions, so they are typed in: Enter adds one.
 */
export const PermissionInput: React.FC<IPermissionInputProps> = ({
  id,
  value,
  onChange,
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = addPermission({ permissions: value, draft });
    if (next !== value) {
      onChange(next);
    }
    setDraft("");
  };

  const remove = (permission: string) =>
    onChange(value.filter((item) => item !== permission));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Keep Enter from submitting the surrounding form.
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <TextInputGroup>
      <TextInputGroupMain
        inputId={id}
        aria-label="Add permission"
        placeholder="Type a permission (e.g. core.view_task) and press Enter"
        value={draft}
        onChange={(_event, next) => setDraft(next)}
        inputProps={{ onKeyDown }}
      >
        {value.length > 0 && (
          <LabelGroup numLabels={10} aria-label="Permissions">
            {value.map((permission) => (
              <Label
                key={permission}
                isCompact
                onClose={() => remove(permission)}
                closeBtnAriaLabel={`Remove ${permission}`}
              >
                {permission}
              </Label>
            ))}
          </LabelGroup>
        )}
      </TextInputGroupMain>
    </TextInputGroup>
  );
};
