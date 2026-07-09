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
              { minNumber: { contains: q, mode: "insensitive" } },
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
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="text-3xl font-bold">სპორტსმენების ბაზა</h1>
      <p className="mt-2 text-sm text-smoke">
        მოძებნეთ სახელით ან MIN ნომრით; გაფილტრეთ ასაკობრივი კატეგორიით.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" action="/athletes">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="სახელი, გვარი ან MIN…"
          className="w-full max-w-xs rounded border border-line bg-coal px-3 py-2 text-sm outline-none placeholder:text-smoke focus:border-wine"
        />
        <select
          name="cat"
          defaultValue={cat ?? ""}
          className="rounded border border-line bg-coal px-3 py-2 text-sm focus:border-wine"
        >
          <option value="">ყველა კატეგორია</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button className="rounded bg-wine px-4 py-2 text-sm font-medium transition-colors hover:bg-flame">
          ძებნა
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-coal text-left text-xs uppercase tracking-wider text-smoke">
            <tr>
              <th className="px-4 py-3">MIN</th>
              <th className="px-4 py-3">სპორტსმენი</th>
              <th className="px-4 py-3">კატეგორია</th>
              <th className="px-4 py-3">კლუბი</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-coal">
                <td className="tnum px-4 py-3 text-smoke">{a.minNumber}</td>
                <td className="px-4 py-3">
                  <Link href={`/athletes/${a.id}`} className="font-medium hover:text-flame">
                    {a.firstName} {a.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-smoke">
                  {CATEGORY_LABELS[categoryFor(a.birthDate)]}
                </td>
                <td className="px-4 py-3 text-smoke">
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
