import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-auth"],
  experimental: {
    // Screenshots are sent to server actions as base64 data URLs, which can
    // exceed the default 1MB body limit.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
