---
title: Branding
sidebar_position: 3
---

# Branding

You can rebrand Pulp UI with your own logo, product name and links. Branding is applied when the image is **built**, not at runtime.

## What you can customize

- Browser tab title, favicon and meta tags
- Masthead logo and title
- About dialog
- Support URL
- PWA manifest

Colors, layout and behavior follow PatternFly and are not part of branding.

## Create a custom branding

Clone the [Pulp UI repository](https://github.com/carlosthe19916/pulp-ui-2), copy the default `branding/` directory and adjust it:

```
branding-custom/
  strings.json          # names, titles and links
  manifest.json         # PWA manifest
  favicon.ico
  images/
    pulp_logo_icon.svg  # masthead logo
    pulp_logo.png       # full-size logo
```

```json title="strings.json"
{
  "application": {
    "title": "Acme Artifacts",
    "name": "Acme Artifacts",
    "description": "Artifact management for Acme"
  },
  "about": {
    "displayName": "Acme Artifacts",
    "imageSrc": "<%= brandingRoot %>/images/pulp_logo_icon.svg",
    "documentationUrl": "https://docs.acme.example.com"
  },
  "masthead": {
    "leftBrand": {
      "src": "<%= brandingRoot %>/images/pulp_logo_icon.svg",
      "alt": "Acme Artifacts",
      "height": "25px"
    },
    "leftTitle": { "text": "Acme Artifacts" },
    "rightBrand": null,
    "supportUrl": "https://support.acme.example.com"
  }
}
```

Image paths must start with `<%= brandingRoot %>`.

## Build

```bash
BRANDING=./branding-custom npm run build
```
