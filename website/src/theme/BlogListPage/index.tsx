import {
  HtmlClassNameProvider,
  PageMetadata,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { Props } from "@theme/BlogListPage";
import BlogListPageStructuredData from "@theme/BlogListPage/StructuredData";
import BlogListPaginator from "@theme/BlogListPaginator";
import BlogLayout from "@theme/BlogLayout";
import BlogPostItems from "@theme/BlogPostItems";
import SearchMetadata from "@theme/SearchMetadata";
import clsx from "clsx";
import React, { type ReactNode } from "react";

// Swizzled (ejected) from @docusaurus/theme-classic to render an <h1> on the
// blog index. Docusaurus' default blog list page has no top-level heading;
// the website's docs-sweep smoke test requires one on every generated page.

function BlogListPageMetadata(props: Props): ReactNode {
  const { metadata } = props;
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext();
  const { blogDescription, blogTitle, permalink } = metadata;
  const isBlogOnlyMode = permalink === "/";
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function BlogListPageContent(props: Props): ReactNode {
  const { metadata, items, sidebar } = props;
  return (
    <BlogLayout sidebar={sidebar}>
      <header className="margin-bottom--lg">
        <h1>{metadata.blogTitle}</h1>
        {metadata.blogDescription && (
          <p className="margin-bottom--none">{metadata.blogDescription}</p>
        )}
      </header>
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}
    >
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
