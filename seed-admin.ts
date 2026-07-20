import { db } from "./src/lib/db";
import { hash } from "bcryptjs";

async function main() {
  const email = "admin@gndsf.ge";
  const password = "Admin2026!";
  const passwordHash = await hash(password, 10);

  const admin = await db.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      name: "მთავარი ადმინისტრატორი",
    },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      name: "მთავარი ადმინისტრატორი",
    },
  });

  console.log("Admin account created/updated:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
