import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = "https://gndsf.ge";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [athletes, comps, news] = await Promise.all([
    db.athlete.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    db.competition.findMany({ where: { isPublished: true }, select: { id: true, startDate: true } }),
    db.news.findMany({ where: { publishedAt: { not: null } }, select: { slug: true, publishedAt: true } }),
  ]);

  const staticPages = ["", "/news", "/calendar", "/clubs", "/athletes", "/rankings", "/competitions", "/documents", "/contact"]
    .map((p) => ({ url: `${BASE}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 }));

  return [
    ...staticPages,
    ...athletes.map((a) => ({
      url: `${BASE}/athletes/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...comps.map((c) => ({
      url: `${BASE}/competitions/${c.id}`,
      lastModified: c.startDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...news.map((n) => ({
      url: `${BASE}/news/${n.slug}`,
      lastModified: n.publishedAt!,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
