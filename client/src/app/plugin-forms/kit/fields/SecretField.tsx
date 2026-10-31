import type React from "react";
import { useState } from "react";

import {
  Button,
  Flex,
  FlexItem,
  InputGroup,
  InputGroupItem,
  Label,
  TextInput,
} from "@patternfly/react-core";
import { EyeIcon } from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import { EyeSlashIcon } from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon";

import type { ISecretValue } from "../derive/codecs";
import type { FormMode } from "../types";
import { CodeEditorField } from "./CodeEditorField";

interface ISecretFieldProps {
  id: string;
  label: string;
  mode: FormMode;
  editor?: "pem";
  value: ISecretValue;
  onChange: (value: ISecretValue) => void;
}

interface ISecretInputProps {
  id: string;
  label: string;
  editor?: "pem";
  value: string;
  onChange: (value: string) => void;
}

const SecretInput: React.FC<ISecretInputProps> = ({
  id,
  label,
  editor,
  value,
  onChange,
}) => {
  const [isShown, setIsShown] = useState(false);
  if (editor === "pem") {
    return (
      <CodeEditorField
        id={id}
        label={label}
        language="pem"
        value={value}
        onChange={onChange}
      />
    );
  }
  return (
    <InputGroup>
      <InputGroupItem isFill>
        <TextInput
          id={id}
          type={isShown ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(_event, next) => onChange(next)}
        />
      </InputGroupItem>
      <InputGroupItem>
        <Button
          variant="control"
          aria-label={isShown ? `Hide ${label}` : `Show ${label}`}
          icon={isShown ? <EyeSlashIcon /> : <EyeIcon />}
          onClick={() => setIsShown((shown) => !shown)}
        />
      </InputGroupItem>
    </InputGroup>
  );
};

/**
 * A write-only value (password, token, private key). The server never returns it, so an
 * edit shows only whether it is set, and the user can change or clear it.
 */
export const SecretField: React.FC<ISecretFieldProps> = ({
  id,
  label,
  mode,
  editor,
  value,
  onChange,
}) => {
  const input = (
    <SecretInput
      id={id}
      label={label}
      editor={editor}
      value={value.value}
      onChange={(next) => onChange({ ...value, mode: "replace", value: next })}
    />
  );
  if (mode === "create") return input;

  const keep = () => onChange({ ...value, mode: "keep", value: "" });

  if (value.mode === "replace") {
    return (
      <Flex
        direction={{ default: "column" }}
        spaceItems={{ default: "spaceItemsSm" }}
      >
        <FlexItem>{input}</FlexItem>
        <FlexItem>
          <Button variant="link" isInline onClick={keep}>
            Undo
          </Button>
        </FlexItem>
      </Flex>
    );
  }

  return (
    <Flex alignItems={{ default: "alignItemsCenter" }}>
      <FlexItem>
        {value.mode === "clear" ? (
          <Label color="orange">Cleared on save</Label>
        ) : (
          <Label color={value.isSet ? "green" : "grey"}>
            {value.isSet ? "Set" : "Not set"}
          </Label>
        )}
      </FlexItem>
      {value.mode === "clear" ? (
        <FlexItem>
          <Button variant="link" isInline onClick={keep}>
            Undo
          </Button>
        </FlexItem>
      ) : (
        <>
          <FlexItem>
            <Button
              id={id}
              variant="link"
              isInline
              aria-label={`${value.isSet ? "Change" : "Set"} ${label}`}
              onClick={() => onChange({ ...value, mode: "replace", value: "" })}
            >
              {value.isSet ? "Change" : "Set"}
            </Button>
          </FlexItem>
          {value.isSet && (
            <FlexItem>
              <Button
                variant="link"
                isInline
                aria-label={`Clear ${label}`}
                onClick={() => onChange({ ...value, mode: "clear", value: "" })}
              >
                Clear
              </Button>
            </FlexItem>
          )}
        </>
      )}
    </Flex>
  );
};
