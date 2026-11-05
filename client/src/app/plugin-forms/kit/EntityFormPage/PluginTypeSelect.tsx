import type React from "react";

import {
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

export interface ITypeOption {
  pulpType: string;
  label: string;
  /** The job this type is for, shown under the select. */
  description?: string;
}

interface IPluginTypeSelectProps {
  id: string;
  options: ITypeOption[];
  value: string;
  onChange: (pulpType: string) => void;
}

/** The create page's first field; hidden when only one type is installed. */
export const PluginTypeSelect: React.FC<IPluginTypeSelectProps> = ({
  id,
  options,
  value,
  onChange,
}) => {
  if (options.length < 2) return null;
  const description = options.find(
    (option) => option.pulpType === value,
  )?.description;
  return (
    <FormGroup label="Type" fieldId={id} isRequired>
      <FormSelect
        id={id}
        value={value}
        onChange={(_event, next) => onChange(next)}
      >
        {options.map((option) => (
          <FormSelectOption
            key={option.pulpType}
            value={option.pulpType}
            label={option.label}
          />
        ))}
      </FormSelect>
      {description && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{description}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};
