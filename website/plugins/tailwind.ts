import tailwindPostcss from "@tailwindcss/postcss";

import type { Plugin } from "@docusaurus/types";

export default function tailwindPlugin(): Plugin {
  return {
    name: "tailwind-plugin",
    configurePostCss(postcssOptions) {
      postcssOptions.plugins.push(tailwindPostcss);
      return postcssOptions;
    },
  };
}
