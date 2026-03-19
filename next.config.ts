import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@anthropic-ai/sdk",
    "bcryptjs",
    "pg",
    "@prisma/adapter-pg",
    "stripe",
  ],
};

export default nextConfig;
