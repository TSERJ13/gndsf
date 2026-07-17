import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { fmtDate, CATEGORY_LABELS, categoryFor } from "@/lib/labels";
import { deleteAthleteDoc } from "./actions";
import DocUploader from "./DocUploader";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენის დოკუმენტები" };

const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

function fmtBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default async function AthleteDocuments({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const { ok } = await searchParams;

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      clubMemberships: { where: { endDate: null }, include: { club: true } },
      documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!athlete) notFound();

  // club manager: own-club athletes only
  if (!REGISTRY.includes(user.role)) {
    const allowed =
      user.role === "CLUB_MANAGER" &&
      athlete.clubMemberships.some((m) => m.clubId === user.clubId);
    if (!allowed) redirect("/admin/athletes");
  }

  const storageReady = !!process.env.BLOB_READ_WRITE_TOKEN;

  return (
    <div>
      <Link href="/admin/athletes" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← სპორტსმენები
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {athlete.firstName} {athlete.lastName}{" "}
        <span className="tabular-nums text-base font-normal text-neutral-400">({athlete.gid})</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {CATEGORY_LABELS[categoryFor(athlete.birthDate)]} ·{" "}
        {athlete.clubMemberships[0]?.club.name ?? "უკლუბო"} · დოკუმენტები
      </p>
      {ok === "uploaded" && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          დოკუმენტი აიტვირთა.
        </p>
      )}
      {ok === "deleted" && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          დოკუმენტი წაიშალა.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="h-fit divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {athlete.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <a href={d.url} target="_blank" className="text-sm font-medium hover:underline">
                  {d.name}
                </a>
                <div className="text-xs tabular-nums text-neutral-500">
                  {fmtBytes(d.size)} · {fmtDate(d.createdAt)}
                  {d.uploadedBy && <> · {d.uploadedBy.name}</>}
                </div>
              </div>
              <form action={deleteAthleteDoc}>
                <input type="hidden" name="id" value={d.id} />
                <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                  წაშლა
                </button>
              </form>
            </li>
          ))}
          {athlete.documents.length === 0 && (
            <li className="px-4 py-6 text-sm text-neutral-500">დოკუმენტები ჯერ არ არის.</li>
          )}
        </ul>

        {storageReady ? (
          <DocUploader athleteId={athlete.id} />
        ) : (
          <p className="h-fit rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
            ფაილების საცავი არ არის კონფიგურირებული — Vercel-ში შექმენით Blob store
            (Storage → Create Database → Blob) და გააკეთეთ Redeploy.
          </p>
        )}
      </div>
    </div>
  );
}
