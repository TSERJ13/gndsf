import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/**/*", "./node_modules/.prisma/**/*"],
    // read at runtime via fs (OG image fonts, Apple Wallet pass assets)
    "/athletes/[id]/opengraph-image": ["./src/assets/fonts/**/*", "./public/brand/logo.png"],
    "/api/wallet/apple": ["./src/assets/pass/**/*"],
  },
};

export default nextConfig;


