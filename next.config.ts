import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@clerk/nextjs"],
  experimental: {
    serverComponentsExternalPackages: ["@clerk/nextjs"],
  },
};

export default nextConfig;
