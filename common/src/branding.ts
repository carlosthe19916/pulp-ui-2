export interface IMastheadBrand {
  src: string;
  alt: string;
  height: string;
}

export interface IMastheadTitle {
  text: string;
  heading?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export interface IBrandingStrings {
  application: {
    title: string;
    name?: string;
    description?: string;
  };

  about: {
    displayName: string;
    imageSrc?: string;
    documentationUrl?: string;
  };

  masthead: {
    leftBrand?: IMastheadBrand;
    leftTitle?: IMastheadTitle;
    rightBrand?: IMastheadBrand;
    supportUrl?: string;
  };
}

// Note: Typescript will look at the `paths` definition to resolve this import
//       to a stub JSON file.  In the next rollup build step, that import will
//       be replaced by the rollup virtual plugin with a dynamically generated
//       JSON import with the actual branding information.
import stringsStub from "@branding/strings.json";

export const brandingStrings: IBrandingStrings = stringsStub;
