import { useState } from "react";

import {
  carryOverValues,
  type FormValues,
  type ITypeSelectProps,
} from "@app/forms";
import {
  buildResourceFilter,
  type ResourceFilterMap,
} from "@app/utils/resourceFilter";
import { type EntityType, getPulpType } from "@catalog";

import { getEntityForm, type IFormEntry } from "./registry";
import { useCreatableTypes } from "./useCreatableTypes";

interface ICreateTypeSelect {
  /** The selected type: `?type=` when creatable, else the first creatable one. */
  pulpType?: string;
  entry?: IFormEntry;
  /** The collection the create POST goes to. */
  apiPath?: string;
  resourceFilter: ResourceFilterMap;
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
  const plugin = pulpType ? getPulpType(pulpType) : undefined;

  return {
    pulpType,
    entry,
    apiPath: plugin?.entities[entity]?.apiPath,
    resourceFilter: buildResourceFilter({ kind: entity, plugin }),
    initialValues: carried?.pulpType === pulpType ? carried.values : undefined,
    typeSelect: {
      options,
      value: pulpType ?? "",
      onChange: (next, values) => {
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
