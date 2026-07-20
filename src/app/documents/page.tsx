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
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        წესები და დოკუმენტები
      </h1>

      {docs.length === 0 && (
        <p className="mt-10 text-center text-[15px] text-gray-500">დოკუმენტები ჯერ არ არის ატვირთული.</p>
      )}

      <div className="space-y-12">
        {[...groups].map(([category, items]) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-black mb-4 pb-2 border-b border-gray-200">
              {category}
            </h2>
            <div className="border border-gray-200 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-black">Document Name</th>
                    <th className="px-4 py-3 font-bold text-black w-24 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-black">
                        <a href={d.fileUrl} className="hover:text-[#c49a5b] transition-colors flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {d.title}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <a href={d.fileUrl} download className="inline-flex items-center justify-center text-[#c49a5b] hover:text-[#b0874e] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
