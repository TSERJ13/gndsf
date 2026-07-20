import Link from "next/link";
import { upcomingTransitions } from "@/lib/transitions";
import { CATEGORY_LABELS } from "@/lib/labels";
import { notifyTransitions } from "@/app/portal/transitions-actions";
import { mailConfigured } from "@/lib/mail";

// Server component: shows who moves to the next age category on 1 January.
// clubId scopes the list (club manager sees only their club); role controls
// whether the "notify leadership" button appears (trainers/managers).
export default async function CategoryTransitions({
  clubId,
  role,
  notified,
}: {
  clubId: string | null;
  role: string;
  notified?: boolean;
}) {
  const list = await upcomingTransitions(clubId);
  if (list.length === 0) return null;

  const year = new Date().getFullYear() + 1;
  const canNotify = role === "CLUB_MANAGER" && mailConfigured();

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-amber-900">
          კატეგორიის ცვლილება — {year} წლის 1 იანვრიდან
        </h2>
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium tabular-nums text-amber-900">
          {list.length}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-amber-200/70">
        {list.map((t) => (
          <li key={t.athleteId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <div>
              <Link href={`/athletes/${t.athleteId}`} className="font-medium text-amber-950 hover:underline">
                {t.name}
              </Link>{" "}
              <span className="tabular-nums text-amber-800/70">({t.gid})</span>
              {!clubId && t.clubName && (
                <span className="text-amber-800/70"> · {t.clubName}</span>
              )}
            </div>
            <div className="tabular-nums text-amber-900">
              {CATEGORY_LABELS[t.from]} <span className="text-amber-800/60">→</span>{" "}
              <b>{CATEGORY_LABELS[t.to]}</b>
            </div>
          </li>
        ))}
      </ul>
      {canNotify && !notified && (
        <form action={notifyTransitions} className="mt-4">
          <button className="rounded bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800">
            ✉ შეატყობინე ხელმძღვანელობას
          </button>
          <p className="mt-1.5 text-xs text-amber-800/70">
            წერილი გაეგზავნება პრეზიდენტს, ვიცე-პრეზიდენტს და გენერალურ მდივანს.
          </p>
        </form>
      )}
      {notified && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          შეტყობინება გაეგზავნა ხელმძღვანელობას.
        </p>
      )}
    </section>
  );
}
