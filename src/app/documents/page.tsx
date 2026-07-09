import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "დოკუმენტები" };

export default async function DocumentsPage() {
  const docs = await db.document.findMany({ orderBy: [{ category: "asc" }, { createdAt: "desc" }] });
  const groups = new Map<string, typeof docs>();
  for (const d of docs) {
    if (!groups.has(d.category)) groups.set(d.category, []);
    groups.get(d.category)!.push(d);
  }
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">წესები და დოკუმენტები</h1>
      {docs.length === 0 && (
        <p className="mt-6 text-sm text-smoke">დოკუმენტები ჯერ არ არის ატვირთული — დაემატება ადმინ პანელიდან.</p>
      )}
      {[...groups].map(([category, items]) => (
        <section key={category} className="mt-8">
          <h2 className="text-lg font-semibold">{category}</h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-coal">
            {items.map((d) => (
              <li key={d.id} className="p-4">
                <a href={d.fileUrl} className="font-medium hover:text-flame">{d.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
