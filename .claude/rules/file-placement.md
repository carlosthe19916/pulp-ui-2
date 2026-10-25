---
paths:
  - client/src/app/**
---

# File placement (`client/src/app/`)

## React directories

Place each module at the narrowest scope that contains every file using it (tests don't
count):

| Used by            | Scope            | Location                                                      |
| :----------------- | :--------------- | :------------------------------------------------------------ |
| One component      | Component folder | Next to the component, in its folder                          |
| One page           | Page directory   | The page's `components/`, `hooks/`, `utils/` or `context/`    |
| More than one page | App root         | `@app/components`, `@app/hooks`, `@app/utils`, `@app/context` |

Only its users decide a module's scope, never its kind: a hook, helper or type used by one
component goes in that component's folder, not `@app/hooks` or `@app/utils`.

Re-check the scope whenever a module or its users move:

- A module that gains a user outside its scope moves up to the narrowest scope that contains
  all its users.
- A module whose users all moved into a narrower scope moves with them. Moving a component
  moves every module only it uses, directly or through another such module, wherever that
  module sits today, with its test.

**Component folder.** A component with private modules (sub-components, form, hook,
helpers, types) gets a flat folder `X/` holding `X.tsx`, those modules, their tests and
`index.ts`. No `components/`, `hooks/` or `context/` inside it.

**Page directory.** Its root holds the page's main component and, if it has one, its
route-to-component adapter.

**Area and entity directories** (`pages/<area>/`, `pages/<area>/<entity>/`) hold only page
directories, never `components/`, `hooks/`, `utils/` or `context/`. A module shared by pages of one
area goes to the app root.

```
client/src/app/
  components/  hooks/  context/  utils/   # app root
    StatusBadge/                          # component folder
      StatusBadge.tsx  statusLabel.ts  index.ts
  pages/
    inventory/                            # area: page directories only
      widgets/                            # entity: page directories only
        widget-list/                      # page directory
          WidgetList.tsx                  # main component
          components/                     # used only by this page
            WidgetModal/                  # component folder
              WidgetModal.tsx  useWidgetForm.ts  index.ts
          hooks/                          # used by several modules of this page
            useWidgetFilters.ts
        widget-detail/                    # page directory
          WidgetDetail.tsx
          WidgetDetailRoute.tsx           # route → component adapter
```

## React Context

A context follows the same scopes as any module. It is a pair: `<Name>Context.ts` holds the
`createContext` call and value type, `<Name>Provider.tsx` holds the provider. Never both in
one file.

- App root or page directory: the pair gets its own folder, `context/<Name>/`.
- Component folder: the pair sits next to the component, flat.

## Checklist

Pass/fail rubric for `/eval`.

- [ ] Each new or moved module, and each module whose users moved, sits at the narrowest
      scope that contains all its users: component folder → page directory → app root.
- [ ] Component folders are flat and hold an `index.ts`.
- [ ] A page directory's root holds its main component and its route adapter, if any.
- [ ] No `components/`, `hooks/`, `utils/` or `context/` under an area or entity directory.
- [ ] New contexts sit at the narrowest scope, split into `<Name>Context.ts` +
      `<Name>Provider.tsx` (in `context/<Name>/` outside a component folder).
