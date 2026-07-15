import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, categoryFor, fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "ლიცენზიის შემოწმება" };

// Public endpoint behind every card's QR: live status straight from the DB.
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ gid: string }>;
}) {
  const { gid } = await params;
  const athlete = await db.athlete.findUnique({
    where: { gid: decodeURIComponent(gid).toUpperCase() },
    include: {
      clubMemberships: { where: { endDate: null }, include: { club: true } },
    },
  });
  if (!athlete) notFound();

  const club = athlete.clubMemberships[0]?.club;

  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <div
        className={`rounded-2xl border p-6 text-center ${
          athlete.isActive
            ? "border-green-500/40 bg-green-500/5"
            : "border-red-500/40 bg-red-500/5"
        }`}
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            athlete.isActive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
          }`}
        >
          {athlete.isActive ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
        </div>
        <h1 className="mt-3 text-xl font-bold">
          {athlete.isActive ? "ლიცენზია აქტიურია" : "ლიცენზია არ არის აქტიური"}
        </h1>
        <p className="tnum mt-1 text-xs text-smoke">
          შემოწმებულია gndsf.ge-ზე · {fmtDate(new Date())}
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-coal p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-ink">
            {athlete.photoUrl ? (
              <Image src={athlete.photoUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-line">
                {athlete.firstName[0]}
              </div>
            )}
          </div>
          <div>
            <div className="font-bold">
              {athlete.firstName} {athlete.lastName}
            </div>
            <div className="tnum text-sm text-wine">{athlete.gid}</div>
            <div className="mt-0.5 text-sm text-smoke">
              {CATEGORY_LABELS[categoryFor(athlete.birthDate)]}
              {club && <> · {club.name}</>}
            </div>
          </div>
        </div>
        <Link
          href={`/athletes/${athlete.id}`}
          className="mt-4 block rounded border border-line px-4 py-2 text-center text-sm text-smoke transition-colors hover:border-wine hover:text-wine"
        >
          სრული პროფილი და შედეგები →
        </Link>
      </div>
    </div>
  );
}
