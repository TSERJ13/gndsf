"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export async function addTask(formData: FormData) {
  const text = formData.get("text") as string;
  if (!text || !text.trim()) return;

  const user = await requireUser();

  await db.adminTask.create({
    data: {
      userId: user.id,
      text: text.trim(),
    },
  });

  revalidatePath("/portal/workspace");
}

export async function toggleTask(id: string, isDone: boolean) {
  const user = await requireUser();

  await db.adminTask.updateMany({
    where: { id, userId: user.id },
    data: { isDone },
  });

  revalidatePath("/portal/workspace");
}

export async function deleteTask(id: string) {
  const user = await requireUser();

  await db.adminTask.deleteMany({
    where: { id, userId: user.id },
  });

  revalidatePath("/portal/workspace");
}
