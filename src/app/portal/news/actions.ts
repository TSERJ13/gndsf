"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { slugify } from "@/lib/slug";

function fields(formData: FormData) {
  const customDateStr = formData.get("publishedAtOverride") as string | null;
  const customDate = customDateStr ? new Date(customDateStr) : null;
  
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim(),
    coverUrl: String(formData.get("coverUrl") ?? "").trim() || null,
    coverFile: formData.get("coverFile") as File | null,
    publish: formData.get("publish") === "on",
    publishedAtOverride: customDate,
  };
}

import { promises as fs } from "fs";
import path from "path";

async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0 || file.name === "undefined") return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public/uploads/news");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/news/${filename}`;
}

async function audit(userId: string, action: string, entityId: string, detail: string) {
  await db.auditLog.create({ data: { userId, action, entity: "News", entityId, detail } });
}

function refresh() {
  for (const p of ["/portal/news", "/news", "/"]) revalidatePath(p);
}

export async function createNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const f = fields(formData);
  if (!f.title || !f.body) redirect("/portal/news?error=fields");

  let slug = slugify(f.title);
  if (await db.news.findUnique({ where: { slug } })) slug = `${slug}-${Date.now() % 10000}`;

  const uploadedUrl = await saveUpload(f.coverFile);
  const finalCover = uploadedUrl || f.coverUrl;

  const n = await db.news.create({
    data: {
      slug,
      title: f.title,
      excerpt: f.excerpt,
      body: f.body,
      coverUrl: finalCover,
      publishedAt: f.publish ? (f.publishedAtOverride || new Date()) : null,
      authorId: user.id,
    },
  });
  await audit(user.id, "NEWS_CREATE", n.id, f.title);
  refresh();
  redirect(`/portal/news?ok=${f.publish ? "published" : "draft"}`);
}

export async function updateNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const f = fields(formData);
  if (!f.title || !f.body) redirect(`/portal/news/${id}?error=fields`);

  const prev = await db.news.findUniqueOrThrow({ where: { id } });
  
  const uploadedUrl = await saveUpload(f.coverFile);
  const finalCover = uploadedUrl || f.coverUrl;

  await db.news.update({
    where: { id },
    data: {
      title: f.title,
      excerpt: f.excerpt,
      body: f.body,
      coverUrl: finalCover,
      publishedAt: f.publish ? (f.publishedAtOverride || prev.publishedAt || new Date()) : null,
    },
  });
  await audit(user.id, "NEWS_UPDATE", id, f.title);
  refresh();
  revalidatePath(`/news/${prev.slug}`);
  redirect("/portal/news?ok=updated");
}

export async function deleteNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const n = await db.news.delete({ where: { id } });
  await audit(user.id, "NEWS_DELETE", id, n.title);
  refresh();
  redirect("/portal/news?ok=deleted");
}
