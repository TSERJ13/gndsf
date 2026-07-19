import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";
import { createNews, deleteNews } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "სიახლეები · ადმინი" };

export default async function AdminNews({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { ok, error } = await searchParams;
  const news = await db.news.findMany({ orderBy: { publishedAt: { sort: "desc", nulls: "first" } } });

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  const MSG: Record<string, string> = {
    published: "სიახლე გამოქვეყნდა — უკვე ჩანს საიტზე.",
    draft: "შენახულია მონახაზად (საიტზე არ ჩანს).",
    updated: "სიახლე განახლდა.",
    deleted: "სიახლე წაიშალა.",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">სიახლეები</h1>
      {ok && MSG[ok] && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{MSG[ok]}</p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          სათაური და ტექსტი სავალდებულოა.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="h-fit divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {news.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={`/admin/news/${n.id}`} className="text-sm font-medium hover:underline">
                  {n.title}
                </Link>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {n.publishedAt ? (
                    <>გამოქვეყნებულია · {fmtDate(n.publishedAt)}</>
                  ) : (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">მონახაზი</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/news/${n.id}`}
                  className="rounded border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
                >
                  რედაქტირება
                </Link>
                <form action={deleteNews}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                    წაშლა
                  </button>
                </form>
              </div>
            </li>
          ))}
          {news.length === 0 && <li className="px-4 py-6 text-sm text-neutral-500">სიახლეები არ არის.</li>}
        </ul>

        <form action={createNews} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ახალი სიახლე</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className={label} htmlFor="title">სათაური</label>
              <input id="title" name="title" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="excerpt">მოკლე ანონსი</label>
              <input id="excerpt" name="excerpt" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="coverUrl">ყდის სურათის ბმული (არასავალდებულო)</label>
              <input id="coverUrl" name="coverUrl" type="url" placeholder="https://" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="body">ტექსტი</label>
              <textarea id="body" name="body" rows={8} required className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publish" defaultChecked className="h-4 w-4" />
              გამოქვეყნდეს ახლავე
            </label>
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
