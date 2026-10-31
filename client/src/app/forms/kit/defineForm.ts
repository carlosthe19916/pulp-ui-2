import type {
  BodyKey,
  FieldKind,
  ICheckboxesField,
  IChoiceField,
  IChoiceOption,
  ICodeField,
  ICustomField,
  IFieldDef,
  IFieldOptions,
  IFileField,
  IFormDef,
  IKeyValueField,
  IResourceField,
  IRowDef,
  ISecretField,
  ISectionDef,
  ISectionItem,
  ISectionOptions,
  ISimpleField,
  IStringListField,
  VirtualKey,
} from "./types";

// `keyof T & string` (not `Extract`) so a generic fragment's literal keys resolve.
type Key<T> = (keyof T & string) | VirtualKey;

type ChoiceValue<T, K> = K extends keyof T
  ? Exclude<T[K], null | undefined>
  : string;

type ElementValue<T, K> = K extends keyof T
  ? NonNullable<T[K]> extends readonly (infer E)[]
    ? E
    : never
  : string;

type ChoiceKind = "select" | "radio" | "tiles";

/** Field builders bound to a request body `T`: a key outside `T` fails to compile. */
export interface IFieldBuilders<T> {
  text: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => ISimpleField<K, "text">;
  url: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => ISimpleField<K, "url">;
  textarea: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => ISimpleField<K, "textarea">;
  number: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => ISimpleField<K, "number">;
  switch: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => ISimpleField<K, "switch">;
  select: <K extends Key<T>, Kd extends ChoiceKind = "select">(
    key: K,
    opts: IFieldOptions & {
      options: IChoiceOption<ChoiceValue<T, K>>[];
      kind?: Kd;
    },
  ) => IChoiceField<K, Kd>;
  stringList: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => IStringListField<K>;
  checkboxes: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & { options: IChoiceOption<ElementValue<T, K>>[] },
  ) => ICheckboxesField<K>;
  keyValue: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & { shape: IKeyValueField<K>["shape"] },
  ) => IKeyValueField<K>;
  secret: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & { editor?: "pem" },
  ) => ISecretField<K>;
  code: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & Omit<ICodeField<K>, "key" | "kind" | "label">,
  ) => ICodeField<K>;
  file: <K extends Key<T>>(key: K, opts: IFieldOptions) => IFileField<K>;
  resource: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & Omit<IResourceField<K>, "key" | "kind" | "label">,
  ) => IResourceField<K>;
  custom: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & Omit<ICustomField<K>, "key" | "kind" | "label">,
  ) => ICustomField<K>;
  // Arrays are inferred whole: TS doesn't union object types across separate candidates.
  row: <I extends IFieldDef[]>(fields: I) => IRowDef<I[number]>;
}

/** The fields of section items, rows flattened. */
type ItemFields<I> = I extends IRowDef<infer F> ? F : I;

export interface ISectionBuilders {
  /** The always-open first section: the fields that define this plugin's object. */
  essentials: <I extends ISectionItem[]>(
    items: I,
    opts?: ISectionOptions,
  ) => ISectionDef<ItemFields<I[number]>>;
  collapsible: <I extends ISectionItem[]>(
    id: string,
    title: string,
    items: I,
    opts?: ISectionOptions,
  ) => ISectionDef<ItemFields<I[number]>>;
}

const fieldBuilders: IFieldBuilders<Record<string, unknown>> = {
  text: (key, opts) => ({ ...opts, key, kind: "text" }),
  url: (key, opts) => ({ ...opts, key, kind: "url" }),
  textarea: (key, opts) => ({ ...opts, key, kind: "textarea" }),
  number: (key, opts) => ({ ...opts, key, kind: "number" }),
  switch: (key, opts) => ({ ...opts, key, kind: "switch" }),
  select: (key, { kind, ...opts }) => ({
    ...opts,
    key,
    kind: kind ?? ("select" as NonNullable<typeof kind>),
  }),
  stringList: (key, opts) => ({ ...opts, key, kind: "stringList" }),
  checkboxes: (key, opts) => ({ ...opts, key, kind: "checkboxes" }),
  keyValue: (key, opts) => ({ ...opts, key, kind: "keyValue" }),
  secret: (key, opts) => ({ ...opts, key, kind: "secret" }),
  code: (key, opts) => ({ ...opts, key, kind: "code" }),
  file: (key, opts) => ({ ...opts, key, kind: "file" }),
  resource: (key, opts) => ({ ...opts, key, kind: "resource" }),
  custom: (key, opts) => ({ ...opts, key, kind: "custom" }),
  row: (fields) => ({ row: fields }),
};

// The inferred field types exist only at compile time; at runtime a section is plain data.
const sectionBuilders = {
  essentials: (items: ISectionItem[], opts?: ISectionOptions): ISectionDef => ({
    ...opts,
    id: "essentials",
    title: "General",
    variant: "essentials",
    items,
  }),
  collapsible: (
    id: string,
    title: string,
    items: ISectionItem[],
    opts?: ISectionOptions,
  ): ISectionDef => ({
    ...opts,
    id,
    title,
    variant: "collapsible",
    items,
  }),
} as ISectionBuilders;

/** What a definition writes: an `IFormDef` whose sections carry their fields' types. */
export interface IFormSpec<
  S extends ISectionDef[],
  O extends string,
> extends Omit<IFormDef, "sections"> {
  sections: S;
  /** API keys deliberately not offered, each with a reason comment. */
  omit?: O[];
}

/** The API value type each field kind can edit. */
interface IKindValue {
  text: string;
  url: string;
  textarea: string;
  // YAML and PEM text, or a JSON value (an object or a list).
  code: unknown;
  secret: string;
  number: number;
  switch: boolean;
  stringList: readonly string[];
  checkboxes: readonly unknown[];
  keyValue: readonly unknown[] | Record<string, unknown>;
  resource: string | readonly string[];
  select: unknown;
  radio: unknown;
  tiles: unknown;
  file: unknown;
  custom: unknown;
}

/** Keys of fields whose kind can't hold the key's API type (e.g. `f.switch("url")`). */
type WrongKind<T, F> = F extends {
  key: infer K;
  kind: infer Kd extends FieldKind;
}
  ? K extends keyof T
    ? [NonNullable<T[K]>] extends [IKindValue[Kd]]
      ? never
      : K
    : never
  : never;

/** Compile error naming the API keys a definition neither renders nor omits. */
export interface IUncoveredApiKeys<K> {
  __uncoveredApiKeys: K;
}

/** Compile error naming the keys rendered with a kind that can't hold their type. */
export interface IWrongKindKeys<K> {
  __wrongKindKeys: K;
}

type SectionFields<S> = S extends ISectionDef<infer F> ? F : never;

type Checked<T, F extends IFieldDef, O extends string> = [
  Exclude<BodyKey<T>, F["key"] | O>,
] extends [never]
  ? [WrongKind<T, F>] extends [never]
    ? IFormDef
    : IWrongKindKeys<WrongKind<T, F>>
  : IUncoveredApiKeys<Exclude<BodyKey<T>, F["key"] | O>>;

/**
 * Declares one plugin's form, typed by its create request body (`<Op>CreateData["body"]`).
 * Every body key must be rendered (with a kind that fits its type) or listed in `omit`, or
 * the result isn't an `IFormDef`.
 */
export const defineForm =
  <T>() =>
  <S extends ISectionDef[], O extends BodyKey<T> = never>(
    build: (builders: {
      f: IFieldBuilders<T>;
      s: ISectionBuilders;
    }) => IFormSpec<S, O>,
  ): Checked<T, SectionFields<S[number]>, O> => {
    const { omit: _omit, ...spec } = build({
      f: fieldBuilders as unknown as IFieldBuilders<T>,
      s: sectionBuilders,
    });
    return spec as unknown as Checked<T, SectionFields<S[number]>, O>;
  };
