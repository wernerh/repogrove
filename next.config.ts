import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — see docs/adr/ADR-002-hosting.md (RG-2, deployed on Azure
  // Static Web Apps: the app ships no server runtime, so the build must
  // produce plain static files in out/. Every route below is fully
  // static-generated via generateStaticParams; there are no API routes or
  // middleware.)
  output: "export",
};

export default nextConfig;
