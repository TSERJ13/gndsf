import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { updateNews } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "სიახლის რედაქტირება" };

export default async function EditNews({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { id } = await params;
  const { error } = await searchParams;
  const n = await db.news.findUnique({ where: { id } });
  if (!n) notFound();

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div className="max-w-2xl">
      <Link href="/portal/news" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← სიახლეები
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">რედაქტირება</h1>
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          სათაური და ტექსტი სავალდებულოა.
        </p>
      )}
      <form action={updateNews} className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
        <input type="hidden" name="id" value={n.id} />
        <div>
          <label className={label} htmlFor="title">სათაური</label>
          <input id="title" name="title" defaultValue={n.title} required className={input} />
        </div>
        <div>
          <label className={label} htmlFor="excerpt">მოკლე ანონსი</label>
          <input id="excerpt" name="excerpt" defaultValue={n.excerpt ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="coverUrl">ყდის სურათის ბმული (არასავალდებულო)</label>
          <input id="coverUrl" name="coverUrl" type="url" defaultValue={n.coverUrl ?? ""} placeholder="https://" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="coverFile">ან ატვირთეთ ფოტო</label>
          <input id="coverFile" name="coverFile" type="file" accept="image/*" className={`${input} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer p-0`} />
        </div>
        <div>
          <label className={label} htmlFor="body">ტექსტი</label>
          <textarea id="body" name="body" rows={14} defaultValue={n.body} required className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" defaultChecked={!!n.publishedAt} className="h-4 w-4" />
          გამოქვეყნებულია
        </label>
        <div>
          <label className={label} htmlFor="publishedAtOverride">გამოქვეყნების დრო (არასავალდებულო)</label>
          <input id="publishedAtOverride" name="publishedAtOverride" type="datetime-local" defaultValue={n.publishedAt ? new Date(n.publishedAt.getTime() - n.publishedAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} className={input} />
        </div>
        <p className="text-xs text-neutral-400">
          ბმული: gndsf.ge/news/{n.slug}
        </p>
        <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          განახლება
        </button>
      </form>
    </div>
  );
}
