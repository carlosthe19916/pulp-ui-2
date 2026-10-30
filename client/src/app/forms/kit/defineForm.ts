import type {
  BodyKey,
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

/** Field builders bound to a request body `T`: a key outside `T` fails to compile. */
export interface IFieldBuilders<T> {
  text: <K extends Key<T>>(key: K, opts: IFieldOptions) => ISimpleField<K>;
  url: <K extends Key<T>>(key: K, opts: IFieldOptions) => ISimpleField<K>;
  textarea: <K extends Key<T>>(key: K, opts: IFieldOptions) => ISimpleField<K>;
  number: <K extends Key<T>>(key: K, opts: IFieldOptions) => ISimpleField<K>;
  switch: <K extends Key<T>>(key: K, opts: IFieldOptions) => ISimpleField<K>;
  select: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions & {
      options: IChoiceOption<ChoiceValue<T, K>>[];
      kind?: "select" | "radio" | "tiles";
    },
  ) => IChoiceField<K>;
  stringList: <K extends Key<T>>(
    key: K,
    opts: IFieldOptions,
  ) => IStringListField<K>;
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
  row: <K extends string>(fields: IFieldDef<K>[]) => IRowDef<K>;
}

export interface ISectionBuilders {
  /** The always-open first section: the fields that define this plugin's object. */
  essentials: <K extends string>(
    items: ISectionItem<K>[],
    opts?: ISectionOptions,
  ) => ISectionDef<K>;
  collapsible: <K extends string>(
    id: string,
    title: string,
    items: ISectionItem<K>[],
    opts?: ISectionOptions,
  ) => ISectionDef<K>;
}

const fieldBuilders: IFieldBuilders<Record<string, unknown>> = {
  text: (key, opts) => ({ ...opts, key, kind: "text" }),
  url: (key, opts) => ({ ...opts, key, kind: "url" }),
  textarea: (key, opts) => ({ ...opts, key, kind: "textarea" }),
  number: (key, opts) => ({ ...opts, key, kind: "number" }),
  switch: (key, opts) => ({ ...opts, key, kind: "switch" }),
  select: (key, { kind = "select", ...opts }) => ({ ...opts, key, kind }),
  stringList: (key, opts) => ({ ...opts, key, kind: "stringList" }),
  keyValue: (key, opts) => ({ ...opts, key, kind: "keyValue" }),
  secret: (key, opts) => ({ ...opts, key, kind: "secret" }),
  code: (key, opts) => ({ ...opts, key, kind: "code" }),
  file: (key, opts) => ({ ...opts, key, kind: "file" }),
  resource: (key, opts) => ({ ...opts, key, kind: "resource" }),
  custom: (key, opts) => ({ ...opts, key, kind: "custom" }),
  row: (fields) => ({ row: fields }),
};

const sectionBuilders: ISectionBuilders = {
  essentials: (items, opts) => ({
    ...opts,
    id: "essentials",
    title: "General",
    variant: "essentials",
    items,
  }),
  collapsible: (id, title, items, opts) => ({
    ...opts,
    id,
    title,
    variant: "collapsible",
    items,
  }),
};

/** What a definition writes: an `IFormDef` whose sections carry their field keys. */
export interface IFormSpec<K extends string, O extends string> extends Omit<
  IFormDef,
  "sections"
> {
  sections: ISectionDef<K>[];
  /** API keys deliberately not offered, each with a reason comment. */
  omit?: O[];
}

/** Compile error naming the API keys a definition neither renders nor omits. */
export interface IUncoveredApiKeys<K> {
  __uncoveredApiKeys: K;
}

type Covered<T, K extends string, O extends string> = [
  Exclude<BodyKey<T>, K | O>,
] extends [never]
  ? IFormDef
  : IUncoveredApiKeys<Exclude<BodyKey<T>, K | O>>;

/**
 * Declares one plugin's form, typed by its create request body (`<Op>CreateData["body"]`).
 * Every body key must be rendered or listed in `omit`, or the result isn't an `IFormDef`.
 */
export const defineForm =
  <T>() =>
  <K extends string, O extends BodyKey<T> = never>(
    build: (builders: {
      f: IFieldBuilders<T>;
      s: ISectionBuilders;
    }) => IFormSpec<K, O>,
  ): Covered<T, K, O> => {
    const { omit: _omit, ...spec } = build({
      f: fieldBuilders as unknown as IFieldBuilders<T>,
      s: sectionBuilders,
    });
    return spec as unknown as Covered<T, K, O>;
  };
