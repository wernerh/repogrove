import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — see docs/adr/ADR-002-hosting.md (RG-2: Azure Storage
  // static-website hosting has no server runtime, so the build must produce
  // plain static files. Every route below is fully static-generated via
  // generateStaticParams; there are no API routes or middleware yet.)
  output: "export",
};

export default nextConfig;
