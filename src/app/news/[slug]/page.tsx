import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.news.findUnique({ where: { slug } });
  if (!a) return { title: "სიახლე" };
  return {
    title: a.title,
    description: a.excerpt ?? a.body.slice(0, 160),
    openGraph: { title: a.title, description: a.excerpt ?? undefined, type: "article" },
  };
}

export default async function NewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.news.findUnique({ where: { slug } });
  if (!article || !article.publishedAt) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <div className="text-xs uppercase tracking-[0.25em] text-wine">{fmtDate(article.publishedAt)}</div>
      <h1 className="mt-3 text-3xl font-bold leading-tight">{article.title}</h1>
      {article.excerpt && <p className="mt-4 text-lg text-smoke">{article.excerpt}</p>}
      <div className="mt-8 whitespace-pre-line leading-relaxed">{article.body}</div>
    </article>
  );
}
