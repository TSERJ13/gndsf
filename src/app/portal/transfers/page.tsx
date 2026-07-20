import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/labels";
import { requestTransfer, approveTransfer, rejectTransfer } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "ტრანსფერები · პორტალი" };

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);
  if (!isRegistryAdmin && user.role !== "CLUB_MANAGER") {
    redirect("/portal");
  }

  const { ok, error } = await searchParams;

  const whereClause = scope
    ? { OR: [{ fromClubId: scope.clubId }, { toClubId: scope.clubId }] }
    : {};

  const requests = await db.clubTransferRequest.findMany({
    where: whereClause,
    include: {
      athlete: true,
      fromClub: true,
      toClub: true,
      requestedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const history = requests.filter((r) => r.status !== "PENDING").slice(0, 20);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";

  return (
    <div>
      <h1 className="text-2xl font-semibold">ტრანსფერები</h1>
      <p className="mt-1 text-sm text-neutral-500">
        მოითხოვეთ სპორტსმენის გადმოსვლა თქვენს კლუბში GID ნომრის მითითებით.
      </p>

      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "requested" && "მოთხოვნა გაიგზავნა."}
          {ok === "approved" && "ტრანსფერი დადასტურდა."}
          {ok === "rejected" && "ტრანსფერი უარყოფილია."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "not_found" && "სპორტსმენი ამ GID-ით ვერ მოიძებნა."}
          {error === "already_in_club" && "სპორტსმენი უკვე ამ კლუბშია."}
          {error === "pending_exists" && "ამ სპორტსმენზე ტრანსფერის მოთხოვნა უკვე არსებობს."}
          {error === "unauthorized" && "თქვენ არ გაქვთ ამ მოქმედების უფლება."}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            მიმდინარე მოთხოვნები ({pending.length})
          </h2>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {pending.map((r) => {
              const canApprove = isRegistryAdmin || (scope && scope.clubId === r.fromClubId);
              return (
                <li key={r.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {r.athlete.firstName} {r.athlete.lastName} ({r.athlete.gid})
                      </span>
                      <p className="mt-1 text-xs text-neutral-500">
                        {r.fromClub ? r.fromClub.name : "უკლუბო"} ➔ {r.toClub.name}
                      </p>
                    </div>
                    {canApprove ? (
                      <div className="flex gap-2">
                        <form action={approveTransfer}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                            დადასტურება
                          </button>
                        </form>
                        <form action={rejectTransfer}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                            უარყოფა
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        მოლოდინში
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {pending.length === 0 && (
              <li className="px-4 py-6 text-sm text-neutral-500">აქტიური მოთხოვნები არ არის.</li>
            )}
          </ul>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            ისტორია
          </h2>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white opacity-80">
            {history.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    {r.athlete.firstName} {r.athlete.lastName}
                    <span className="ml-2 text-xs text-neutral-500">
                      {r.fromClub ? r.fromClub.name : "უკლუბო"} ➔ {r.toClub.name}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${r.status === "APPROVED" ? "text-green-600" : "text-red-600"}`}>
                    {r.status === "APPROVED" ? "დადასტურდა" : "უარყოფილია"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-400">{fmtDate(r.updatedAt)}</div>
              </li>
            ))}
            {history.length === 0 && (
              <li className="px-4 py-6 text-sm text-neutral-500">ისტორია ცარიელია.</li>
            )}
          </ul>
        </div>

        <form action={requestTransfer} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">მოთხოვნის გაგზავნა</h2>
          <p className="mt-1 text-xs text-neutral-500">
            შეიყვანეთ სპორტსმენის GID ნომერი, რომლის გადმოსვლაც გსურთ თქვენს კლუბში.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-500" htmlFor="gid">
                სპორტსმენის GID
              </label>
              <input 
                type="text" 
                id="gid" 
                name="gid" 
                placeholder="მაგ: 1234" 
                required 
                className={input} 
              />
            </div>
            {isRegistryAdmin && (
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500" htmlFor="toClubId">
                  მიმღები კლუბი (ადმინი)
                </label>
                <input 
                  type="text" 
                  id="toClubId" 
                  name="toClubId" 
                  placeholder="Club ID" 
                  className={input} 
                />
              </div>
            )}
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
              მოთხოვნა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
