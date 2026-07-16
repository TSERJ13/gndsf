import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAthlete } from "@/lib/rbac";
import { CATEGORY_LABELS, categoryFor, fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "ჩემი ბარათი" };

const BASE = "https://gndsf.ge";

export default async function CardPage() {
  const user = await requireAthlete();
  const athlete = await db.athlete.findUniqueOrThrow({
    where: { id: user.athleteId },
    include: {
      clubMemberships: { where: { endDate: null }, include: { club: true } },
    },
  });

  const verifyUrl = `${BASE}/verify/${athlete.gid}`;
  const qr = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 480,
    errorCorrectionLevel: "M",
  });

  const club = athlete.clubMemberships[0]?.club;
  const season = new Date().getFullYear();
  const nameEn =
    athlete.firstNameEn && athlete.lastNameEn
      ? `${athlete.firstNameEn} ${athlete.lastNameEn}`
      : null;

  const appleReady = !!process.env.APPLE_PASS_SIGNER_CERT;
  const googleReady = !!process.env.GOOGLE_WALLET_SA_KEY;

  const row = "flex justify-between gap-4 border-b border-white/10 py-2.5 text-sm";
  const k = "text-white/50";

  return (
    <div className="mx-auto max-w-md px-4 pt-10">
      <Link href="/cabinet" className="text-sm text-smoke hover:text-wine">
        ← კაბინეტი
      </Link>

      {/* The card itself is always dark — like a physical license */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#101014] text-white shadow-2xl">
        <div className="h-2 bg-wine" />
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-2.5">
            <Image src="/brand/logo-header.png" alt="" width={34} height={34} />
            <div>
              <div className="text-sm font-bold tracking-[0.1em]">GNDSF</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50">
                სპორტსმენის ლიცენზია
              </div>
            </div>
          </div>
          {athlete.isActive ? (
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
              აქტიური
            </span>
          ) : (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">
              შეჩერებული
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              სახელი / Name
            </div>
            <div className="mt-1 text-2xl font-bold leading-tight">
              {athlete.firstName} {athlete.lastName}
            </div>
            {nameEn && <div className="text-sm text-white/60">{nameEn}</div>}
            <div className="tnum mt-3 text-lg font-semibold tracking-wider text-wine">
              {athlete.gid}
            </div>
          </div>
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-white/5">
            {athlete.photoUrl ? (
              <Image src={athlete.photoUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-bold text-white/20">
                {athlete.firstName[0]}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className={row}>
            <span className={k}>დაბადების თარიღი</span>
            <span className="tnum">{fmtDate(athlete.birthDate)}</span>
          </div>
          <div className={row}>
            <span className={k}>ასაკობრივი კატეგორია</span>
            <span>{CATEGORY_LABELS[categoryFor(athlete.birthDate)]}</span>
          </div>
          <div className={row}>
            <span className={k}>კლუბი</span>
            <span className="text-right">{club?.name ?? "—"}</span>
          </div>
          <div className={row}>
            <span className={k}>ლიცენზია</span>
            <span className="tnum">{season} სეზონი</span>
          </div>
          <div className="flex justify-between gap-4 py-2.5 text-sm">
            <span className={k}>ფედერაცია</span>
            <span className="text-right">GNDSF · gndsf.ge</span>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 pb-6 pt-2">
          <div className="rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR: ${verifyUrl}`} width={190} height={190} />
          </div>
          <div className="tnum mt-2 text-sm tracking-[0.2em] text-white/70">{athlete.gid}</div>
          <div className="mt-1 text-[10px] text-white/40">
            სკანირება ადასტურებს ლიცენზიას gndsf.ge-ზე
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {appleReady && (
          <a
            href="/api/wallet/apple"
            className="block rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white ring-1 ring-white/20"
          >
             Apple Wallet-ში დამატება
          </a>
        )}
        {googleReady && (
          <a
            href="/api/wallet/google"
            className="block rounded-lg bg-[#1f1f1f] px-4 py-3 text-center text-sm font-medium text-white ring-1 ring-white/20"
          >
            Google Wallet-ში დამატება
          </a>
        )}
        {!appleReady && !googleReady && (
          <div className="rounded-lg border border-line bg-coal p-4 text-xs text-smoke">
            <p className="font-medium text-silver">სწრაფი წვდომა შეჯიბრებაზე:</p>
            <p className="mt-1.5">
              iPhone: Safari → გაზიარება <span className="text-silver">⎋</span> → „Add to Home Screen“
            </p>
            <p className="mt-1">
              Android: Chrome → მენიუ <span className="text-silver">⋮</span> → „Add to Home screen“
            </p>
            <p className="mt-1.5">
              მთავარ ეკრანზე გაჩნდება GNDSF-ის აიკონი — ბარათი ერთი შეხებით გაიხსნება.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
