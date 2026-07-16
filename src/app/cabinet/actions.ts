"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAthlete } from "@/lib/rbac";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Production (Vercel): stores in Vercel Blob — the serverless filesystem
// is read-only, so local writes are dev-only. Create a Blob store in the
// Vercel dashboard; BLOB_READ_WRITE_TOKEN is injected automatically.
export async function uploadPhoto(formData: FormData) {
  const user = await requireAthlete();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect("/cabinet?error=nofile");
  const ext = ALLOWED[file.type];
  if (!ext) redirect("/cabinet?error=type");
  if (file.size > MAX_BYTES) redirect("/cabinet?error=size");

  // On Vercel the filesystem is read-only: without a Blob store there is
  // nowhere to save. Fail politely instead of crashing the server action.
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.VERCEL) {
    redirect("/cabinet?error=storage");
  }

  let photoUrl: string;

  try {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`athletes/${user.athleteId}${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    photoUrl = blob.url;
  } else {
    // dev fallback: write to /public/uploads
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "public", "uploads", "athletes");
    await mkdir(dir, { recursive: true });
    const filename = `${user.athleteId}${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    photoUrl = `/uploads/athletes/${filename}?v=${Date.now()}`;
  }
  } catch (e) {
    console.error("photo upload failed:", e);
    redirect("/cabinet?error=storage");
  }

  await db.athlete.update({
    where: { id: user.athleteId },
    data: { photoUrl },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "ATHLETE_PHOTO_UPLOAD",
      entity: "Athlete",
      entityId: user.athleteId,
      detail: `${Math.round(file.size / 1024)} KB`,
    },
  });

  revalidatePath("/cabinet");
  redirect("/cabinet?ok=photo");
}
