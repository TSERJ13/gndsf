import Link from "next/link";
import type { Athlete } from "@prisma/client";
import { fmtDate } from "@/lib/labels";
import { isMinor } from "@/lib/athleteRegistration";
import {
  approveAthleteAction,
  returnAthleteAction,
  updatePendingAthlete,
  sendInviteAction,
} from "../actions";

const MESSAGES: Record<string, { text: string; ok: boolean }> = {
  "created=pending": { text: "განაცხადი გაიგზავნა ფედერაციაში. ახლა ატვირთეთ დაბადების მოწმობა ან პირადობა (დოკუმენტები).", ok: true },
  "created=approved": { text: "ათლეტი დარეგისტრირდა და დამტკიცდა.", ok: true },
  "approved=sent": { text: "დამტკიცდა. ათლეტს/მშობელს გაეგზავნა კაბინეტის მოსაწვევი E-CARD-ით.", ok: true },
  "approved=no-email": { text: "დამტკიცდა, მაგრამ ელფოსტა არ არის მითითებული — მოსაწვევი ვერ გაიგზავნა.", ok: false },
  "approved=email-taken": { text: "დამტკიცდა, მაგრამ ეს ელფოსტა სხვა ანგარიშს ეკუთვნის — მიუთითეთ სხვა და გაგზავნეთ მოსაწვევი.", ok: false },
  "returned=1": { text: "განაცხადი დაუბრუნდა კლუბს კომენტარით.", ok: true },
  "saved=1": { text: "შესწორებული განაცხადი გაიგზავნა ფედერაციაში.", ok: true },
  "invite=sent": { text: "მოსაწვევი გაიგზავნა.", ok: true },
  "invite=no-email": { text: "ელფოსტა არ არის მითითებული.", ok: false },
  "invite=email-taken": { text: "ეს ელფოსტა სხვა ანგარიშს ეკუთვნის.", ok: false },
  "error=note": { text: "დაბრუნებისას კომენტარი სავალდებულოა.", ok: false },
  "error=contact": { text: "არასრულწლოვნისთვის საჭიროა მშობლის სახელი და ელფოსტა, სრულწლოვნისთვის — ათლეტის ელფოსტა.", ok: false },
  "error=exists": { text: "ამ პირადი ნომრით სხვა ათლეტი უკვე რეგისტრირებულია.", ok: false },
  "error=fields": { text: "შეავსეთ ყველა სავალდებულო ველი.", ok: false },
};

const input =
  "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
const label = "text-xs uppercase tracking-wider text-neutral-500";

export default function RegistrationPanel({
  athlete,
  params,
  canApprove,
  canEditPending,
  canInvite,
  hasAccount,
}: {
  athlete: Athlete;
  params: Record<string, string | undefined>;
  canApprove: boolean;
  canEditPending: boolean;
  canInvite: boolean;
  hasAccount: boolean;
}) {
  const msgKey = Object.entries(params).map(([k, v]) => `${k}=${v}`).find((k) => MESSAGES[k]);
  const msg = msgKey ? MESSAGES[msgKey] : null;
  const minor = isMinor(athlete.birthDate);
  const iso = athlete.birthDate.toISOString().slice(0, 10);

  return (
    <div className="mt-6 space-y-4">
      {msg && (
        <p className={`rounded border px-3 py-2 text-sm ${msg.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}

      {athlete.status !== "APPROVED" && (
        <div className={`rounded-xl border p-5 ${athlete.status === "PENDING" ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50"}`}>
          <div className="font-semibold">
            {athlete.status === "PENDING" ? "განაცხადი ფედერაციის განხილვაშია" : "განაცხადი დაბრუნდა შესასწორებლად"}
          </div>
          {athlete.status === "REJECTED" && athlete.reviewNote && (
            <p className="mt-1 text-sm">კომენტარი: {athlete.reviewNote}</p>
          )}
          <p className="mt-1 text-sm text-neutral-600">
            დოკუმენტები:{" "}
            <Link href={`/portal/athletes/${athlete.id}/documents`} className="underline">
              ნახვა / ატვირთვა
            </Link>
          </p>

          {canApprove && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <form action={approveAthleteAction}>
                <input type="hidden" name="id" value={athlete.id} />
                <button className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                  დამტკიცება (GID + E-CARD + მოსაწვევი)
                </button>
              </form>
              <form action={returnAthleteAction} className="space-y-2">
                <input type="hidden" name="id" value={athlete.id} />
                <textarea name="note" rows={2} required placeholder="რა უნდა შეასწოროს კლუბმა" className={input} />
                <button className="w-full rounded bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-800">
                  დაბრუნება კლუბისთვის
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {athlete.status !== "APPROVED" && canEditPending && (
        <form action={updatePendingAthlete} className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">განაცხადის ჩასწორება</h2>
          <input type="hidden" name="id" value={athlete.id} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div><label className={label}>სახელი *</label><input name="firstName" defaultValue={athlete.firstName} required className={input} /></div>
            <div><label className={label}>გვარი *</label><input name="lastName" defaultValue={athlete.lastName} required className={input} /></div>
            <div><label className={label}>სახელი (ENG)</label><input name="firstNameEn" defaultValue={athlete.firstNameEn ?? ""} className={input} /></div>
            <div><label className={label}>გვარი (ENG)</label><input name="lastNameEn" defaultValue={athlete.lastNameEn ?? ""} className={input} /></div>
            <div><label className={label}>დაბადების თარიღი *</label><input name="birthDate" type="date" defaultValue={iso} required className={input} /></div>
            <div><label className={label}>პირადი ნომერი *</label><input name="personalNumber" defaultValue={athlete.personalNumber ?? ""} required className={input} /></div>
            <div><label className={label}>ელფოსტა {minor ? "" : "*"}</label><input name="email" type="email" defaultValue={athlete.email ?? ""} className={input} /></div>
            <div><label className={label}>ტელეფონი</label><input name="phone" defaultValue={athlete.phone ?? ""} className={input} /></div>
            <div><label className={label}>მშობელი {minor ? "*" : ""}</label><input name="parentName" defaultValue={athlete.parentName ?? ""} className={input} /></div>
            <div><label className={label}>მშობლის ელფოსტა {minor ? "*" : ""}</label><input name="parentEmail" type="email" defaultValue={athlete.parentEmail ?? ""} className={input} /></div>
            <div><label className={label}>მშობლის ტელეფონი</label><input name="parentPhone" defaultValue={athlete.parentPhone ?? ""} className={input} /></div>
            <div><label className={label}>ახალი ფოტო</label><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full text-sm" /></div>
          </div>
          <button className="mt-4 w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700">
            შენახვა და ფედერაციაში გაგზავნა
          </button>
        </form>
      )}

      {athlete.status === "APPROVED" && canInvite && (
        <form action={sendInviteAction} className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">კაბინეტი და E-CARD</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {hasAccount ? "ანგარიში არსებობს. შეგიძლიათ მოსაწვევის ხელახლა გაგზავნა." : "ანგარიში ჯერ არ არის."}
            {athlete.reviewedAt ? ` დამტკიცდა: ${fmtDate(athlete.reviewedAt)}.` : ""}
          </p>
          <input type="hidden" name="id" value={athlete.id} />
          {!hasAccount && (
            <input name="email" type="email" placeholder={athlete.parentEmail ?? athlete.email ?? "ელფოსტა"} className={input} />
          )}
          <button className="mt-3 w-full rounded border border-neutral-900 py-2 text-sm font-medium hover:bg-neutral-100">
            მოსაწვევის გაგზავნა
          </button>
        </form>
      )}
    </div>
  );
}
