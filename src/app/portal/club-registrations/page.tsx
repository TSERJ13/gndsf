import { db } from "@/lib/db";
import { requireCapability } from "@/lib/permissions";
import { fmtDate } from "@/lib/labels";
import { approveClubRegistration, rejectClubRegistration } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "სტუდიის მოთხოვნები · პორტალი" };

export default async function ClubRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireCapability("CLUB_SIGNUP_REVIEW");
  const { ok } = await searchParams;

  const [pending, reviewed] = await Promise.all([
    db.clubRegistration.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    db.clubRegistration.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      take: 15,
      include: { reviewedBy: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">სტუდიის რეგისტრაციის მოთხოვნები</h1>
      <p className="mt-1 text-sm text-neutral-500">
        დამტკიცებისას ერთდროულად იქმნება კლუბი და კლუბის მენეჯერის
        ანგარიში — სტუდია დაუყოვნებლივ შედის იმ ელფოსტა/პაროლით, რაც
        განაცხადში მიუთითა.
      </p>
      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "approved" ? "სტუდია დამტკიცდა და კლუბის ანგარიში შეიქმნა." : "მოთხოვნა უარყოფილია."}
        </p>
      )}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-neutral-500">
        განსახილველი ({pending.length})
      </h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {pending.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="font-semibold">{r.name}</div>
            <div className="mt-1 text-sm text-neutral-500">{r.city}{r.address ? ` · ${r.address}` : ""}</div>
            <div className="mt-3 space-y-1 text-sm">
              <div><span className="text-neutral-400">საკონტაქტო პირი:</span> {r.contactName}</div>
              <div><span className="text-neutral-400">ელფოსტა:</span> {r.email}</div>
              {r.phone && <div><span className="text-neutral-400">ტელეფონი:</span> {r.phone}</div>}
              <div className="tabular-nums text-neutral-400">{fmtDate(r.createdAt)}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <form action={approveClubRegistration} className="flex-1">
                <input type="hidden" name="id" value={r.id} />
                <button className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
                  დამტკიცება
                </button>
              </form>
              <form action={rejectClubRegistration} className="flex-1">
                <input type="hidden" name="id" value={r.id} />
                <button className="w-full rounded bg-red-50 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                  უარყოფა
                </button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-neutral-500">
            განსახილველი მოთხოვნა არ არის.
          </div>
        )}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-400">
        ბოლო განხილული
      </h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-2">სტუდია</th>
              <th className="px-4 py-2">სტატუსი</th>
              <th className="px-4 py-2">განმხილველი</th>
              <th className="px-4 py-2">თარიღი</th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">
                  {r.status === "APPROVED" ? (
                    <span className="text-green-700">დამტკიცებული</span>
                  ) : (
                    <span className="text-red-700">უარყოფილი</span>
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-500">{r.reviewedBy?.name ?? "—"}</td>
                <td className="px-4 py-2 tabular-nums text-neutral-400">
                  {r.reviewedAt ? fmtDate(r.reviewedAt) : "—"}
                </td>
              </tr>
            ))}
            {reviewed.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  ჯერ არაფერია განხილული.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
