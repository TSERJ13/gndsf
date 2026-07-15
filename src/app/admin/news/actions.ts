"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { slugify } from "@/lib/slug";

function fields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim(),
    publish: formData.get("publish") === "on",
  };
}

async function audit(userId: string, action: string, entityId: string, detail: string) {
  await db.auditLog.create({ data: { userId, action, entity: "News", entityId, detail } });
}

function refresh() {
  for (const p of ["/admin/news", "/news", "/"]) revalidatePath(p);
}

export async function createNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const f = fields(formData);
  if (!f.title || !f.body) redirect("/admin/news?error=fields");

  let slug = slugify(f.title);
  if (await db.news.findUnique({ where: { slug } })) slug = `${slug}-${Date.now() % 10000}`;

  const n = await db.news.create({
    data: {
      slug,
      title: f.title,
      excerpt: f.excerpt,
      body: f.body,
      publishedAt: f.publish ? new Date() : null,
      authorId: user.id,
    },
  });
  await audit(user.id, "NEWS_CREATE", n.id, f.title);
  refresh();
  redirect(`/admin/news?ok=${f.publish ? "published" : "draft"}`);
}

export async function updateNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const f = fields(formData);
  if (!f.title || !f.body) redirect(`/admin/news/${id}?error=fields`);

  const prev = await db.news.findUniqueOrThrow({ where: { id } });
  await db.news.update({
    where: { id },
    data: {
      title: f.title,
      excerpt: f.excerpt,
      body: f.body,
      publishedAt: f.publish ? (prev.publishedAt ?? new Date()) : null,
    },
  });
  await audit(user.id, "NEWS_UPDATE", id, f.title);
  refresh();
  revalidatePath(`/news/${prev.slug}`);
  redirect("/admin/news?ok=updated");
}

export async function deleteNews(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const n = await db.news.delete({ where: { id } });
  await audit(user.id, "NEWS_DELETE", id, n.title);
  refresh();
  redirect("/admin/news?ok=deleted");
}
