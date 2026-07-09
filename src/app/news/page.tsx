import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "სიახლეები" };

export default async function NewsPage() {
  const news = await db.news.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">სიახლეები</h1>
      <ul className="mt-8 space-y-4">
        {news.map((n) => (
          <li key={n.id}>
            <Link href={`/news/${n.slug}`} className="block rounded-lg border border-line bg-coal p-5 transition-colors hover:border-wine">
              <div className="text-xs text-smoke">{n.publishedAt && fmtDate(n.publishedAt)}</div>
              <h2 className="mt-1 text-lg font-semibold">{n.title}</h2>
              {n.excerpt && <p className="mt-1 text-sm text-smoke">{n.excerpt}</p>}
            </Link>
          </li>
        ))}
        {news.length === 0 && <p className="text-sm text-smoke">სიახლეები ჯერ არ არის.</p>}
      </ul>
    </div>
  );
}
