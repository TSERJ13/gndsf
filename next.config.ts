import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
  // Photos are shrunk in the browser first; this leaves room for a
  // ~1600px JPEG while staying under Vercel's 4.5 MB request limit.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/**/*", "./node_modules/.prisma/**/*"],
    // read at runtime via fs (OG image fonts, Apple Wallet pass assets)
    "/athletes/[id]/opengraph-image": ["./src/assets/fonts/**/*", "./public/brand/logo.png"],
    "/api/wallet/apple": ["./src/assets/pass/**/*"],
  },
};

export default nextConfig;


