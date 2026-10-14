import {
  FormGroup,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";

import type { IPlugin } from "@catalog";

interface IPluginTypeSelectorProps {
  available: IPlugin[];
  selectedType: string;
  onChange: (value: string) => void;
}

/**
 * The create-time plugin-type dropdown, shared by every family modal (plain and
 * wizard). Renders nothing unless there is a genuine choice (>1 available type).
 */
export const PluginTypeSelector = ({
  available,
  selectedType,
  onChange,
}: IPluginTypeSelectorProps) => {
  if (available.length <= 1) return null;
  return (
    <FormGroup label="Type" fieldId="entity-type" isRequired>
      <FormSelect
        id="entity-type"
        value={selectedType}
        onChange={(_e, value) => onChange(value)}
      >
        {available.map((p) => (
          <FormSelectOption
            key={p.pulpType}
            value={p.pulpType}
            label={p.label}
          />
        ))}
      </FormSelect>
    </FormGroup>
  );
};
