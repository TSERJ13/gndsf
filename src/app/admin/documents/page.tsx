import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";
import { uploadDocument, deleteDocument } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "დოკუმენტები · ადმინი" };

export default async function AdminDocuments({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { ok, error } = await searchParams;
  const docs = await db.document.findMany({ orderBy: { createdAt: "desc" } });

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">დოკუმენტები</h1>
      <p className="mt-1 text-sm text-neutral-500">
        წესდება, რეგლამენტები, ფორმები — PDF ფაილები საჯარო გვერდისთვის.
      </p>
      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "uploaded" ? "დოკუმენტი აიტვირთა — უკვე ჩანს საიტზე." : "დოკუმენტი წაიშალა."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "type"
            ? "მხოლოდ PDF ფაილია დაშვებული."
            : error === "size"
              ? "ფაილი 15 MB-ზე დიდია."
              : "სათაური და ფაილი სავალდებულოა."}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="h-fit divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <a href={d.fileUrl} target="_blank" className="text-sm font-medium hover:underline">
                  {d.title}
                </a>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {d.category} · {fmtDate(d.createdAt)}
                </div>
              </div>
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={d.id} />
                <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                  წაშლა
                </button>
              </form>
            </li>
          ))}
          {docs.length === 0 && <li className="px-4 py-6 text-sm text-neutral-500">დოკუმენტები არ არის.</li>}
        </ul>

        <form action={uploadDocument} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ატვირთვა</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className={label} htmlFor="title">სათაური</label>
              <input id="title" name="title" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="category">კატეგორია</label>
              <select id="category" name="category" className={input}>
                <option value="წესდება">წესდება</option>
                <option value="რეგლამენტი">რეგლამენტი</option>
                <option value="ფორმები">ფორმები</option>
                <option value="სხვა">სხვა</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="file">PDF ფაილი (მაქს. 15 MB)</label>
              <input id="file" name="file" type="file" accept="application/pdf" required className={`${input} file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1`} />
            </div>
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              ატვირთვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
