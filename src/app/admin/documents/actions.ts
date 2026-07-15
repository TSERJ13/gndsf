"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

function refresh() {
  for (const p of ["/admin/documents", "/documents"]) revalidatePath(p);
}

// PDF upload: Vercel Blob in production, /public/uploads fallback in dev
export async function uploadDocument(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "წესები";
  const file = formData.get("file");

  if (!title || !(file instanceof File) || file.size === 0) {
    redirect("/admin/documents?error=fields");
  }
  if (file.type !== "application/pdf") redirect("/admin/documents?error=type");
  if (file.size > MAX_BYTES) redirect("/admin/documents?error=size");

  let fileUrl: string;
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`documents/${safeName}`, file, { access: "public" });
    fileUrl = blob.url;
  } else {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
    fileUrl = `/uploads/documents/${safeName}`;
  }

  const doc = await db.document.create({ data: { title, category, fileUrl } });
  await db.auditLog.create({
    data: { userId: user.id, action: "DOCUMENT_UPLOAD", entity: "Document", entityId: doc.id, detail: title },
  });
  refresh();
  redirect("/admin/documents?ok=uploaded");
}

export async function deleteDocument(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const doc = await db.document.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "DOCUMENT_DELETE", entity: "Document", entityId: id, detail: doc.title },
  });
  refresh();
  redirect("/admin/documents?ok=deleted");
}
