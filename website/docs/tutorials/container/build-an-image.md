---
title: Build an image
sidebar_label: Build an image
sidebar_position: 4
---

# Build an image

**Goal:** build a container image from a Containerfile inside Pulp, instead of building locally and
pushing — similar to a Quay build trigger or an Artifactory build.

:::warning[Tech preview]
Image building is a tech preview in `pulp_container`. Behaviour and fields may change.
:::

Set up a repository with the [Container registry tutorial](../container.mdx).

## Build

1. Open the repository → **kebab (⋮) → Build image**.
2. Provide the build inputs:

   | Field         | What it is                                                          |
   | ------------- | ------------------------------------------------------------------- |
   | Containerfile | Upload a `Containerfile`, or give the name of one in the context.   |
   | Tag           | The tag to apply to the built image.                                |
   | Build context | Files the build needs (the equivalent of the Docker build context). |

3. Confirm. The build runs as a [task](../../using-pulp/monitor-tasks.md); when it finishes the
   image is a new tag in the repository, ready to [serve](../../using-pulp/serve-content.md) and
   pull.

## Related

- [Tag and untag images](./tag-and-untag-images.md)
- [Container registry tutorial](../container.mdx) · plugin docs:
  [pulp_container](https://pulpproject.org/pulp_container/)
