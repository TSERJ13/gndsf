// One-off: move e-card ID documents / signed agreements that were uploaded
// before the private bucket existed out of the PUBLIC R2 bucket.
//
// For each AthleteRegistration document stored as a public URL:
//   copy object → R2_PRIVATE_BUCKET_NAME, update the row to "r2-private:…",
//   then delete the public copy.
// Profile photos are left alone (they are meant to be public).
//
// Dry run (default):  npx tsx scripts/migrate-ecard-docs-private.ts
// Apply:              npx tsx scripts/migrate-ecard-docs-private.ts --apply
// Needs DATABASE_URL and all R2_* variables (see .env.example).
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const apply = process.argv.includes("--apply");
const publicBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
const publicBucket = process.env.R2_BUCKET_NAME;
const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME;
if (!publicBase || !publicBucket || !privateBucket) {
  throw new Error("Set R2_PUBLIC_URL, R2_BUCKET_NAME and R2_PRIVATE_BUCKET_NAME");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

const FIELDS = ["idDocumentUrl", "signedAgreementUrl", "parentIdDocumentUrl"] as const;

async function moveToPrivate(url: string) {
  const srcKey = decodeURIComponent(url.slice(publicBase.length + 1));
  const ext = srcKey.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const destKey = `documents/${crypto.randomUUID()}.${ext}`;
  if (!apply) return { srcKey, ref: `r2-private:${privateBucket}/${destKey}` };

  const obj = await s3.send(new GetObjectCommand({ Bucket: publicBucket, Key: srcKey }));
  const body = Buffer.from(await obj.Body!.transformToByteArray());
  await s3.send(
    new PutObjectCommand({
      Bucket: privateBucket,
      Key: destKey,
      Body: body,
      ContentType: obj.ContentType ?? "application/octet-stream",
      ContentDisposition: "inline",
    }),
  );
  return { srcKey, ref: `r2-private:${privateBucket}/${destKey}` };
}

async function main() {
  const regs = await db.athleteRegistration.findMany({
    select: { id: true, idDocumentUrl: true, signedAgreementUrl: true, parentIdDocumentUrl: true },
  });
  let moved = 0;
  for (const reg of regs) {
    const data: Record<string, string> = {};
    const toDelete: string[] = [];
    for (const f of FIELDS) {
      const v = reg[f];
      if (!v || !v.startsWith(`${publicBase}/`)) continue;
      const { srcKey, ref } = await moveToPrivate(v);
      data[f] = ref;
      toDelete.push(srcKey);
      console.log(`${apply ? "moved" : "would move"} ${reg.id}.${f}: ${srcKey}`);
    }
    if (!apply || toDelete.length === 0) continue;
    await db.athleteRegistration.update({ where: { id: reg.id }, data });
    // delete public copies only after the row points to the private ones
    for (const key of toDelete) await s3.send(new DeleteObjectCommand({ Bucket: publicBucket, Key: key }));
    moved += toDelete.length;
  }
  console.log(apply ? `Done: ${moved} file(s) moved.` : "Dry run only. Re-run with --apply.");
}

main().finally(() => db.$disconnect());
