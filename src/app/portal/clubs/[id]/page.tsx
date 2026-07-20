import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { updateClub, toggleClubActive } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "კლუბის რედაქტირება" };

export default async function EditClub({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { id } = await params;
  const { ok, error } = await searchParams;
  const c = await db.club.findUnique({
    where: { id },
    include: {
      _count: { select: { memberships: { where: { endDate: null } } } },
      managers: true,
    },
  });
  if (!c) notFound();

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div className="max-w-xl">
      <Link href="/portal/clubs" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← კლუბები
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{c.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {c._count.memberships} აქტიური სპორტსმენი ·{" "}
        {c.managers.map((m) => m.name).join(", ") || "მენეჯერი არ ჰყავს"}
      </p>

      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "updated" ? "შენახულია." : "სტატუსი შეიცვალა."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "hasathletes"
            ? "კლუბს აქტიური სპორტსმენები ჰყავს — ჯერ ტრანსფერით გადაიყვანეთ."
            : "სახელი და ქალაქი სავალდებულოა."}
        </p>
      )}

      <form action={updateClub} className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
        <input type="hidden" name="id" value={c.id} />
        <div>
          <label className={label} htmlFor="name">დასახელება</label>
          <input id="name" name="name" defaultValue={c.name} required className={input} />
        </div>
        <div>
          <label className={label} htmlFor="nameEn">დასახელება (EN)</label>
          <input id="nameEn" name="nameEn" defaultValue={c.nameEn ?? ""} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="city">ქალაქი</label>
            <input id="city" name="city" defaultValue={c.city} required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="phone">ტელეფონი</label>
            <input id="phone" name="phone" defaultValue={c.phone ?? ""} className={input} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="address">მისამართი</label>
          <input id="address" name="address" defaultValue={c.address ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="email">ელფოსტა</label>
          <input id="email" name="email" type="email" defaultValue={c.email ?? ""} className={input} />
        </div>
        <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          შენახვა
        </button>
      </form>

      <form action={toggleClubActive} className="mt-4">
        <input type="hidden" name="id" value={c.id} />
        <button
          className={`rounded border px-4 py-2 text-sm ${
            c.isActive
              ? "border-red-200 text-red-700 hover:bg-red-50"
              : "border-green-300 text-green-700 hover:bg-green-50"
          }`}
        >
          {c.isActive ? "კლუბის გათიშვა" : "კლუბის ჩართვა"}
        </button>
      </form>
    </div>
  );
}
