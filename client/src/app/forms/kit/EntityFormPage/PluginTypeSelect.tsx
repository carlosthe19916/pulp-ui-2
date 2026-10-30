import type React from "react";

import {
  FormGroup,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";

export interface ITypeOption {
  pulpType: string;
  label: string;
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
}) =>
  options.length < 2 ? null : (
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
    </FormGroup>
  );
