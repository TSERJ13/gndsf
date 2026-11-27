"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAthlete } from "@/lib/rbac";
import { uploadPhoto as uploadResized } from "@/lib/image";

// Photo is shrunk in the browser (PhotoInput) and re-encoded on the server
// to a medium-size WebP (src/lib/image.ts) before it goes to Vercel Blob.
export async function uploadPhoto(formData: FormData) {
  const user = await requireAthlete();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect("/cabinet?error=nofile");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/cabinet?error=storage");

  let photoUrl: string | null = null;
  try {
    photoUrl = await uploadResized(file, `athletes/${user.athleteId}`);
  } catch (e) {
    console.error("photo upload failed:", e);
    redirect("/cabinet?error=storage");
  }
  if (!photoUrl) redirect("/cabinet?error=type");

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
