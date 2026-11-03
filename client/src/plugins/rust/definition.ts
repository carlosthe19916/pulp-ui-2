import { definePlugin } from "@plugin-sdk/definition";

/** Rust: a Cargo registry for private crates, or a pull-through cache of crates.io. */
export const rust = definePlugin({
  id: "rust",
  packages: ["rust", "pulp_rust", "pulp-rust"],
  remote: { "rust.rust": { apiPath: "rust/rust" } },
  repository: {
    // No publications: distributions serve the sparse index straight from a version.
    "rust.rust": {
      apiPath: "rust/rust",
      compatibleRemoteTypes: ["rust.rust"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      actions: {
        "add-cached-content": {
          path: "add_cached_content/",
          target: "repository",
        },
      },
    },
  },
  distribution: { "rust.rust": { apiPath: "rust/rust" } },
  // Crates arrive through `cargo publish` or the pull-through cache, never a content upload.
  content: {
    "rust.rust": { apiPath: "rust/packages" },
    "rust.rust_yank": { apiPath: "rust/yanks" },
  },
});
