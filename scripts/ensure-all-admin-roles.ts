import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Ensuring all admin role accounts exist in DB with active status...');

  // Never hardcode passwords: this repository is public.
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword || initialPassword.length < 12) {
    throw new Error('Set ADMIN_INITIAL_PASSWORD (12+ chars) before running this script.');
  }
  const defaultPasswordHash = await hash(initialPassword, 10);

  const accounts = [
    {
      email: 'admin@gndsf.ge',
      name: 'მთავარი ადმინისტრატორი',
      role: 'SUPER_ADMIN' as Role,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'president@gndsf.ge',
      name: 'ფედერაციის პრეზიდენტი',
      role: 'PRESIDENT' as Role,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'vicepresident@gndsf.ge',
      name: 'ვიცე-პრეზიდენტი',
      role: 'VICE_PRESIDENT' as Role,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'secretary@gndsf.ge',
      name: 'გენერალური მდივანი',
      role: 'GENERAL_SECRETARY' as Role,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'ritmi@gndsf.ge',
      name: 'კლუბ „რიტმის“ მენეჯერი',
      role: 'CLUB_MANAGER' as Role,
      passwordHash: defaultPasswordHash,
    },
  ];

  for (const acc of accounts) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash: acc.passwordHash,
        role: acc.role,
        name: acc.name,
        isActive: true,
      },
      create: {
        email: acc.email,
        passwordHash: acc.passwordHash,
        role: acc.role,
        name: acc.name,
        isActive: true,
      },
    });
    console.log(`✓ Account ready: ${user.email} (${user.role})`);
  }

  console.log('All 5 admin role accounts created/updated successfully. Each user must change the initial password in /portal/settings.');
}

main()
  .catch((e) => {
    console.error('Error seeding admin accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
