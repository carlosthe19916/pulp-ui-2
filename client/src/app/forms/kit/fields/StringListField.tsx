import type React from "react";
import { useState } from "react";

import {
  Button,
  Label,
  LabelGroup,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import { TimesIcon } from "@patternfly/react-icons/dist/esm/icons/times-icon";

interface IStringListFieldProps {
  id: string;
  label: string;
  value: string[];
  isDisabled: boolean;
  onChange: (value: string[]) => void;
}

const splitEntries = (text: string): string[] =>
  text
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

/** A list of strings as removable chips; Enter, a comma or pasting several adds them. */
export const StringListField: React.FC<IStringListFieldProps> = ({
  id,
  label,
  value,
  isDisabled,
  onChange,
}) => {
  const [draft, setDraft] = useState("");

  const commit = (text: string) => {
    const entries = splitEntries(text).filter(
      (entry) => !value.includes(entry),
    );
    if (entries.length) onChange([...value, ...new Set(entries)]);
    setDraft("");
  };

  return (
    <TextInputGroup isDisabled={isDisabled}>
      <TextInputGroupMain
        inputId={id}
        aria-label={label}
        value={draft}
        placeholder={value.length ? undefined : "Type a value and press Enter"}
        onChange={(_event, next) => {
          if (/[,\s]/.test(next)) commit(next);
          else setDraft(next);
        }}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
          } else if (event.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      >
        {value.length > 0 && (
          <LabelGroup numLabels={8}>
            {value.map((entry) => (
              <Label
                key={entry}
                variant="outline"
                onClose={
                  isDisabled
                    ? undefined
                    : () => onChange(value.filter((item) => item !== entry))
                }
              >
                {entry}
              </Label>
            ))}
          </LabelGroup>
        )}
      </TextInputGroupMain>
      {value.length > 0 && !isDisabled && (
        <TextInputGroupUtilities>
          <Button
            variant="plain"
            aria-label={`Clear ${label.toLowerCase()}`}
            icon={<TimesIcon />}
            onClick={() => onChange([])}
          />
        </TextInputGroupUtilities>
      )}
    </TextInputGroup>
  );
};
