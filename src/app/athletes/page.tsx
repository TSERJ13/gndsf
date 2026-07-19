import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, categoryFor } from "@/lib/labels";
import type { AgeCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენები" };

type Search = { q?: string; cat?: string };

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, cat } = await searchParams;

  const athletes = await db.athlete.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { firstNameEn: { contains: q, mode: "insensitive" } },
              { lastNameEn: { contains: q, mode: "insensitive" } },
              { gid: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      clubMemberships: {
        where: { endDate: null },
        include: { club: true },
      },
    },
    orderBy: [{ lastName: "asc" }],
    take: 100,
  });

  const filtered = cat
    ? athletes.filter((a) => categoryFor(a.birthDate) === (cat as AgeCategory))
    : athletes;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16">
      <h1 className="heading-display text-center text-3xl md:text-4xl">სპორტსმენების ბაზა</h1>
      <p className="mt-4 text-center text-sm font-medium text-smoke">
        მოძებნეთ სახელით ან GID ნომრით; გაფილტრეთ ასაკობრივი კატეგორიით.
      </p>

      <form className="mt-10 flex flex-wrap justify-center gap-4" action="/athletes">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="სახელი, გვარი ან GID…"
          className="w-full max-w-xs rounded-full border border-line bg-transparent px-5 py-2.5 text-sm outline-none transition-colors placeholder:text-smoke focus:border-[#005eb8]"
        />
        <select
          name="cat"
          defaultValue={cat ?? ""}
          className="rounded-full border border-line bg-transparent px-5 py-2.5 text-sm transition-colors focus:border-[#005eb8]"
        >
          <option value="">ყველა კატეგორია</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-[#005eb8] px-8 py-2.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90">
          ძებნა
        </button>
      </form>

      <div className="mt-12 overflow-x-auto border-t border-line">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f8f8] text-left text-xs uppercase tracking-wider text-[#555] dark:bg-[#1a1a1a] dark:text-[#aaa]">
            <tr>
              <th className="px-6 py-4 font-bold">GID</th>
              <th className="px-6 py-4 font-bold">სპორტსმენი</th>
              <th className="px-6 py-4 font-bold">კატეგორია</th>
              <th className="px-6 py-4 font-bold">კლუბი</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-coal">
                <td className="tnum px-6 py-4 text-smoke">{a.gid}</td>
                <td className="px-6 py-4">
                  <Link href={`/athletes/${a.id}`} className="font-bold text-silver hover:text-[#005eb8]">
                    {a.firstName} {a.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-smoke">
                  {CATEGORY_LABELS[categoryFor(a.birthDate)]}
                </td>
                <td className="px-6 py-4 text-smoke">
                  {a.clubMemberships[0]?.club.name ?? "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-smoke">
                  ამ პარამეტრებით სპორტსმენი ვერ მოიძებნა. სცადეთ სხვა ფილტრი.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
