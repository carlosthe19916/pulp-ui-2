import type React from "react";

import {
  Button,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons/dist/esm/icons/minus-circle-icon";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";

import { type IKeyValueRow, newKeyValueRow } from "../derive/codecs";

interface IKeyValueFieldProps {
  id: string;
  label: string;
  value: IKeyValueRow[];
  onChange: (value: IKeyValueRow[]) => void;
}

/** Name/value rows (HTTP headers, labels) with add and remove. */
export const KeyValueField: React.FC<IKeyValueFieldProps> = ({
  id,
  label,
  value,
  onChange,
}) => {
  const update = ({ index, row }: { index: number; row: IKeyValueRow }) =>
    onChange(value.map((current, i) => (i === index ? row : current)));

  return (
    <Stack hasGutter>
      {value.map((row, index) => (
        <StackItem key={row.id}>
          <Split hasGutter>
            <SplitItem isFilled>
              <TextInput
                id={index === 0 ? id : `${id}-name-${index}`}
                aria-label={`${label} name ${index + 1}`}
                placeholder="Name"
                value={row.key}
                onChange={(_event, key) =>
                  update({ index, row: { ...row, key } })
                }
              />
            </SplitItem>
            <SplitItem isFilled>
              <TextInput
                aria-label={`${label} value ${index + 1}`}
                placeholder="Value"
                value={row.value}
                onChange={(_event, next) =>
                  update({ index, row: { ...row, value: next } })
                }
              />
            </SplitItem>
            <SplitItem>
              <Button
                variant="plain"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                icon={<MinusCircleIcon />}
                onClick={() => onChange(value.filter((_row, i) => i !== index))}
              />
            </SplitItem>
          </Split>
        </StackItem>
      ))}
      <StackItem>
        <Button
          variant="link"
          isInline
          icon={<PlusCircleIcon />}
          onClick={() => onChange([...value, newKeyValueRow()])}
        >
          Add {label.toLowerCase()}
        </Button>
      </StackItem>
    </Stack>
  );
};
