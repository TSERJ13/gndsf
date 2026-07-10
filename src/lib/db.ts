import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";

// Hack to force Vercel's NFT bundler to include the prisma schema in the serverless function
const _schemaPath = path.join(process.cwd(), "prisma/schema.prisma");
const _schemaPath2 = path.join(process.cwd(), "node_modules/.prisma/client/schema.prisma");
const _schemaPath3 = path.join(process.cwd(), "node_modules/.prisma/client/index.js");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
