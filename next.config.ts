import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["./prisma/**/*", "./node_modules/.prisma/**/*"],
    },
  },
};

export default nextConfig;

