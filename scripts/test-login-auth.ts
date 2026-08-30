import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing authentication comparison for all 5 admin role accounts...');

  const accountsToTest = [
    { email: 'admin@gndsf.ge', pass: 'gndsf2026!' },
    { email: 'president@gndsf.ge', pass: 'gndsf2026!' },
    { email: 'vicepresident@gndsf.ge', pass: 'gndsf2026!' },
    { email: 'secretary@gndsf.ge', pass: 'gndsf2026!' },
    { email: 'ritmi@gndsf.ge', pass: 'gndsf2026!' },
  ];

  for (const acc of accountsToTest) {
    const user = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!user) {
      console.error(`❌ User not found: ${acc.email}`);
      continue;
    }
    const match = await bcrypt.compare(acc.pass, user.passwordHash);
    console.log(`${match ? '✓' : '❌'} Login test for ${acc.email} (${user.role}): ${match ? 'SUCCESS (Password verified)' : 'FAILED'}`);
  }
}

main().finally(() => prisma.$disconnect());
