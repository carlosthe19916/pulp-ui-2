import React from "react";

import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import CallToAction from "../components/home/CallToAction";
import ContentTypes from "../components/home/ContentTypes";
import Features from "../components/home/Features";
import Hero from "../components/home/Hero";
import HowItWorks from "../components/home/HowItWorks";
import QuickStart from "../components/home/QuickStart";

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.tagline} description={siteConfig.tagline}>
      <main>
        <Hero />
        <ContentTypes />
        <Features />
        <HowItWorks />
        <QuickStart />
        <CallToAction />
      </main>
    </Layout>
  );
}
