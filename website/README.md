# Pulp UI website

User-facing landing page and documentation for Pulp UI, built with [Docusaurus](https://docusaurus.io/) and [Tailwind CSS](https://tailwindcss.com/) using the [PatternFly](https://www.patternfly.org/) palette.

This is a standalone npm project (not part of the root workspaces).

```bash
cd website
npm ci
npm start -- --port 3001   # dev server (port 3000 is used by the client)
npm run build              # static site in build/
npm run serve -- --port 3001
npm run typecheck
```

- Landing page: `src/pages/index.tsx` + `src/components/home/`
- Docs: `docs/` (sidebar in `sidebars.ts`)
- Theme tokens (Tailwind `@theme` + Infima overrides): `src/css/custom.css`
