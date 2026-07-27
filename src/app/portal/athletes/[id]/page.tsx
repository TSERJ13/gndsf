import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { fmtDate, CATEGORY_LABELS, categoryFor } from "@/lib/labels";
import { requestAthleteEdit, updateAthleteDirectly } from "./actions";
import DeleteAthleteButton from "./DeleteAthleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენის პროფილი" };

const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

export default async function AthleteProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const { ok, error } = await searchParams;

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      clubMemberships: { where: { endDate: null }, include: { club: true } },
    },
  });
  if (!athlete) notFound();

  // Check permissions
  const isRegistry = REGISTRY.includes(user.role);
  if (!isRegistry) {
    const allowed =
      user.role === "CLUB_MANAGER" &&
      athlete.clubMemberships.some((m) => m.clubId === user.clubId);
    if (!allowed) redirect("/portal/athletes");
  }

  // Check if there is an active pending request
  const pendingRequest = await db.athleteEditRequest.findFirst({
    where: { athleteId: id, status: "PENDING" },
  });

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link
          href="/portal/athletes"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold">სპორტსმენის პროფილი</h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Column: Current Details */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">მონაცემები</h2>
              <span className="rounded bg-neutral-100 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-neutral-600">
                {athlete.gid}
              </span>
            </div>

            <div className="grid gap-y-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">სახელი გვარი</div>
                <div className="mt-1 font-medium text-neutral-900">{athlete.firstName} {athlete.lastName}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Name Surname</div>
                <div className="mt-1 font-medium text-neutral-900">{athlete.firstNameEn || "—"} {athlete.lastNameEn || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">დაბადების თარიღი</div>
                <div className="mt-1 font-medium text-neutral-900">{fmtDate(athlete.birthDate)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">კატეგორია</div>
                <div className="mt-1 font-medium text-neutral-900">{CATEGORY_LABELS[categoryFor(athlete.birthDate)]}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">სქესი</div>
                <div className="mt-1 font-medium text-neutral-900">{athlete.gender === "MALE" ? "მამრობითი" : "მდედრობითი"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">მიმდინარე კლუბი</div>
                <div className="mt-1 font-medium text-neutral-900">{athlete.clubMemberships[0]?.club.name ?? "—"}</div>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">დოკუმენტები</h2>
              <p className="mt-1 text-sm text-neutral-500">პირადობის და სხვა საბუთების მართვა</p>
            </div>
            <Link
              href={`/portal/athletes/${athlete.id}/documents`}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              ნახვა
            </Link>
          </div>
        </div>

        {/* Right Column: Edit Request Form */}
        <div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900">მონაცემების რედაქტირება</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              სახელის ან გვარის შესაცვლელად გთხოვთ გააგზავნოთ მოთხოვნა.
              მოთხოვნას განიხილავს ფედერაციის ადმინისტრაცია.
            </p>

            {ok === "requested" && (
              <div className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-800 border border-green-200">
                მოთხოვნა წარმატებით გაიგზავნა!
              </div>
            )}
            
            {ok === "updated" && (
              <div className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-800 border border-green-200">
                მონაცემები წარმატებით განახლდა!
              </div>
            )}
            
            {error && (
              <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-200">
                შეცდომა! გთხოვთ შეავსოთ ველები სწორად.
              </div>
            )}

            {pendingRequest && !isRegistry ? (
              <div className="mt-6 rounded-lg bg-orange-50 p-4 border border-orange-200">
                <h3 className="font-semibold text-orange-900">მოთხოვნა განხილვაშია</h3>
                <p className="mt-1 text-sm text-orange-800">
                  მოთხოვნილია მონაცემების შეცვლა:<br/>
                  <b>{pendingRequest.firstName} {pendingRequest.lastName}</b>
                  {pendingRequest.birthDate && (
                    <>
                      <br/>დაბადების თარიღი: <b>{fmtDate(pendingRequest.birthDate)}</b>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <form action={isRegistry ? updateAthleteDirectly : requestAthleteEdit} className="mt-6 space-y-4">
                <input type="hidden" name="athleteId" value={athlete.id} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="firstName">
                      სახელი
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      defaultValue={athlete.firstName}
                      required
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="lastName">
                      გვარი
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      defaultValue={athlete.lastName}
                      required
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="firstNameEn">
                      სახელი (ENG)
                    </label>
                    <input
                      id="firstNameEn"
                      name="firstNameEn"
                      type="text"
                      defaultValue={athlete.firstNameEn || ""}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="lastNameEn">
                      გვარი (ENG)
                    </label>
                    <input
                      id="lastNameEn"
                      name="lastNameEn"
                      type="text"
                      defaultValue={athlete.lastNameEn || ""}
                      className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="birthDate">
                    დაბადების თარიღი
                  </label>
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={athlete.birthDate.toISOString().split('T')[0]}
                    required
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  {isRegistry ? "ცვლილებების შენახვა" : "მოთხოვნის გაგზავნა"}
                </button>
              </form>
            )}

            {/* Delete button below the form for Admins */}
            {["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT"].includes(user.role) && (
              <div className="mt-12 pt-6 border-t border-red-100">
                <h3 className="text-sm font-semibold text-red-900 mb-2">სპორტსმენის წაშლა</h3>
                <p className="text-xs text-red-700 mb-4">თუ სპორტსმენი შეცდომით დაემატა სისტემაში.</p>
                <DeleteAthleteButton athleteId={athlete.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
