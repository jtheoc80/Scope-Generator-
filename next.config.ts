import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@clerk/nextjs", "@clerk/shared"],
};

export default nextConfig;
