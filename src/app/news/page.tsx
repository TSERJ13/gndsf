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
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
        <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-12 tracking-wide">
          სიახლეები
        </h1>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => (
          <article 
            key={n.id} 
            className="group block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 transition-transform hover:-translate-y-1 flex flex-col"
          >
            <Link href={`/news/${n.slug}`} className="block flex-1">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-50">
                {n.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.coverUrl}
                    alt={n.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-3xl font-black text-gray-200">GNDSF</div>
                  </div>
                )}
              </div>
              
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <h2 className="text-[20px] md:text-[22px] font-light leading-tight text-black mb-6">
                  {n.title}
                </h2>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="tnum text-[14px] font-bold text-black">
                    {n.publishedAt && `${String(n.publishedAt.getDate()).padStart(2, '0')}/${String(n.publishedAt.getMonth() + 1).padStart(2, '0')}/${n.publishedAt.getFullYear()}`}
                  </span>
                  
                  <div className="flex gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      სიახლე
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
        {news.length === 0 && (
          <p className="col-span-full py-10 text-center text-[15px] text-gray-500">
            სიახლეები ჯერ არ არის.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
