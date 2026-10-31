import { useState } from "react";

import { useCreatableTypes } from "@app/hooks/useCreatableTypes";
import {
  carryOverValues,
  type FormValues,
  type ITypeSelectProps,
} from "@app/plugin-forms";
import { type EntityType, getPulpType } from "@catalog";
import { getEntityForm, type IFormEntry } from "@plugins";

export interface ICreateTypeSelect {
  /** The selected type: `?type=` when creatable, else the first creatable one. */
  pulpType?: string;
  entry?: IFormEntry;
  /** The collection the create POST goes to. */
  apiPath?: string;
  typeSelect: ITypeSelectProps;
  /** Values carried over from the type the user switched away from. */
  initialValues?: FormValues;
}

/**
 * A create page's Type select: resolves the selected type and, on a switch, keeps the
 * values the two forms share. `onTypeChange` writes the new type to the URL.
 */
export const useCreateTypeSelect = ({
  entity,
  type,
  onTypeChange,
}: {
  entity: EntityType;
  type: string | undefined;
  onTypeChange: (pulpType: string) => void;
}): ICreateTypeSelect => {
  const [carried, setCarried] = useState<{
    pulpType: string;
    values: FormValues;
  } | null>(null);

  const options = useCreatableTypes(entity);
  const pulpType =
    options.find((option) => option.pulpType === type)?.pulpType ??
    options[0]?.pulpType;
  const entry = pulpType
    ? getEntityForm({ entity, pulpType, mode: "create" })
    : undefined;

  return {
    pulpType,
    entry,
    apiPath: pulpType
      ? getPulpType(pulpType)?.entities[entity]?.apiPath
      : undefined,
    initialValues: carried?.pulpType === pulpType ? carried.values : undefined,
    typeSelect: {
      options,
      value: pulpType ?? "",
      onChange: ({ pulpType: next, values }) => {
        const nextEntry = getEntityForm({
          entity,
          pulpType: next,
          mode: "create",
        });
        if (entry && nextEntry) {
          setCarried({
            pulpType: next,
            values: carryOverValues({
              from: entry.form,
              to: nextEntry.form,
              values,
            }),
          });
        }
        onTypeChange(next);
      },
    },
  };
};
