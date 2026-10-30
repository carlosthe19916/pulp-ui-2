import type React from "react";
import { useState } from "react";

import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  TextInput,
} from "@patternfly/react-core";

import { type IKeyValue, parseLabelInput } from "@app/utils/pulpLabels";

interface IAddLabelFieldProps {
  onAdd: (label: IKeyValue) => void;
}

/** A `key=value` field that validates its own input and reports a parsed label via `onAdd`. */
export const AddLabelField: React.FC<IAddLabelFieldProps> = ({ onAdd }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = parseLabelInput(value);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    onAdd(parsed);
    setValue("");
    setError(null);
  };

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <FormGroup label="Add label" fieldId="edit-labels-input">
        <InputGroup>
          <InputGroupItem isFill>
            <TextInput
              id="edit-labels-input"
              aria-label="Add label"
              value={value}
              placeholder="key=value"
              onChange={(_event, next) => {
                setValue(next);
                if (error) setError(null);
              }}
              validated={error ? "error" : "default"}
            />
          </InputGroupItem>
          <InputGroupItem>
            <Button
              type="submit"
              variant="secondary"
              isDisabled={!value.trim()}
            >
              Add
            </Button>
          </InputGroupItem>
        </InputGroup>
        {error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error">{error}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    </Form>
  );
};
