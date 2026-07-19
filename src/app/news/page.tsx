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
    <div className="mx-auto max-w-[1400px] px-6 pt-16">
      <h1 className="heading-display text-center text-3xl md:text-4xl">სიახლეები</h1>
      <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => (
          <article key={n.id} className="group">
            <Link href={`/news/${n.slug}`} className="block">
              <div className="relative aspect-[16/9] overflow-hidden bg-coal">
                {n.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coal via-ink to-coal">
                    {/* Placeholder graphic if no cover */}
                    <div className="text-4xl font-bold text-line">GNDSF</div>
                  </div>
                )}
              </div>
              <h2 className="mt-5 text-[20px] font-light leading-snug text-silver md:text-[22px]">
                {n.title}
              </h2>
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="tnum text-[15px] font-bold text-silver">
                {n.publishedAt && `${String(n.publishedAt.getDate()).padStart(2, '0')}/${String(n.publishedAt.getMonth() + 1).padStart(2, '0')}/${n.publishedAt.getFullYear()}`}
              </span>
              
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-bold text-[#555] transition-colors hover:bg-[#e0e0e0]">
                  სიახლე
                </span>
                {n.excerpt && (
                  <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-bold text-[#555] transition-colors hover:bg-[#e0e0e0]">
                    {n.excerpt.substring(0, 15)}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
        {news.length === 0 && (
          <p className="col-span-full text-center text-sm text-smoke">
            სიახლეები ჯერ არ არის.
          </p>
        )}
      </div>
    </div>
  );
}
