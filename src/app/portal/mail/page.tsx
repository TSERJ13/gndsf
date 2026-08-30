import Link from "next/link";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/permissions";
import { decrypt } from "@/lib/crypto";
import { listMessages, type MailListItem } from "@/lib/mailbox";
import { connectMailbox, disconnectMailbox, composeMail } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "ფოსტა · ადმინი" };

const fmtDT = (d: Date) =>
  new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function AdminMail({
  searchParams,
}: {
  searchParams: Promise<{ box?: string; ok?: string; error?: string }>;
}) {
  const user = await requireCapability("MAIL_ACCESS");
  const { box: boxParam, ok, error } = await searchParams;
  const box = boxParam === "sent" ? "sent" : boxParam === "spam" ? "spam" : boxParam === "trash" ? "trash" : "inbox";

  const account = await db.mailAccount.findUnique({ where: { userId: user.id } });

  let messages: MailListItem[] = [];
  let listError = false;
  if (account) {
    try {
      messages = await listMessages(account.email, decrypt(account.encSecret), box);
    } catch (e) {
      console.error("mail list failed:", e);
      listError = true;
    }
  }

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  const MSG: Record<string, string> = {
    connected: "ფოსტა დაკავშირდა — შემოსული წერილები ქვემოთაა.",
    disconnected: "ფოსტა გაითიშა.",
    sent: "წერილი გაიგზავნა.",
    deleted: "წერილი წაიშალა.",
  };
  const ERR: Record<string, string> = {
    fields: "შეიყვანეთ @gndsf.ge მისამართი და პაროლი.",
    login: "Titan-მა შესვლა არ დაუშვა — გადაამოწმეთ პაროლი, ჩართეთ third-party access და გამორთეთ 2FA ამ ყუთზე.",
    compose: "მიმღები, თემა და ტექსტი სავალდებულოა.",
    send: "გაგზავნა ვერ მოხერხდა — სცადეთ ხელახლა.",
    delete: "წერილის წაშლა ვერ მოხერხდა.",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">ფოსტა</h1>
        {account && (
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            {account.email}
            <form action={disconnectMailbox}>
              <button className="text-xs underline-offset-2 hover:underline">გათიშვა</button>
            </form>
          </div>
        )}
      </div>

      {ok && MSG[ok] && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{MSG[ok]}</p>
      )}
      {error && ERR[error] && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{ERR[error]}</p>
      )}

      {!account ? (
        <div className="mt-6 max-w-md">
          <form action={connectMailbox} className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">ფოსტის დაკავშირება</h2>
            <p className="mt-1 text-xs text-neutral-500">
              შეიყვანეთ თქვენი @gndsf.ge ყუთის მონაცემები. პაროლი ინახება
              დაშიფრული (AES-256) და მოწმდება Titan-თან შენახვამდე.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="m-email">ელფოსტა</label>
                <input id="m-email" name="email" type="email" placeholder="president@gndsf.ge" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="m-pass">პაროლი</label>
                <input id="m-pass" name="password" type="password" required className={input} />
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                დაკავშირება
              </button>
              <p className="text-xs text-neutral-400">
                Titan-ის მხარეს ამ ყუთზე ჩართული უნდა იყოს third-party access და
                გამორთული 2FA — სხვანაირად Titan გარე შეერთებას ბლოკავს.
              </p>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/portal/mail"
                className={`rounded px-3 py-1.5 text-sm ${box === "inbox" ? "bg-neutral-900 text-white" : "border border-neutral-300 hover:bg-neutral-50"}`}
              >
                შემოსული
              </Link>
              <Link
                href="/portal/mail?box=sent"
                className={`rounded px-3 py-1.5 text-sm ${box === "sent" ? "bg-neutral-900 text-white" : "border border-neutral-300 hover:bg-neutral-50"}`}
              >
                გაგზავნილი
              </Link>
              <Link
                href="/portal/mail?box=spam"
                className={`rounded px-3 py-1.5 text-sm ${box === "spam" ? "bg-neutral-900 text-white" : "border border-neutral-300 hover:bg-neutral-50"}`}
              >
                სპამი
              </Link>
              <Link
                href="/portal/mail?box=trash"
                className={`rounded px-3 py-1.5 text-sm ${box === "trash" ? "bg-red-600 text-white border-transparent" : "text-red-600 border border-red-200 hover:bg-red-50"}`}
              >
                წაშლილი
              </Link>
            </div>

            <ul className="mt-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              {listError && (
                <li className="px-4 py-6 text-sm text-red-700">
                  ფოსტასთან დაკავშირება ვერ მოხერხდა — სცადეთ განახლება, ან გათიშეთ და ხელახლა დააკავშირეთ.
                </li>
              )}
              {!listError && messages.length === 0 && (
                <li className="px-4 py-6 text-sm text-neutral-500">წერილები არ არის.</li>
              )}
              {messages.map((m) => (
                <li key={m.uid}>
                  <Link
                    href={`/portal/mail/msg/${m.uid}?box=${box}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <div className={`truncate text-sm ${!m.seen && box === "inbox" ? "font-bold" : "font-medium"}`}>
                        {box === "inbox" ? m.from : `→ ${m.to}`}
                      </div>
                      <div className="truncate text-sm text-neutral-600">{m.subject}</div>
                    </div>
                    <div className="shrink-0 text-xs tabular-nums text-neutral-400">
                      {m.date ? fmtDT(m.date) : ""}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <form action={composeMail} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">ახალი წერილი</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="c-to">მიმღები</label>
                <input id="c-to" name="to" type="email" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-subject">თემა</label>
                <input id="c-subject" name="subject" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-body">ტექსტი</label>
                <textarea id="c-body" name="body" rows={8} required className={input} />
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                გაგზავნა
              </button>
              <p className="text-xs text-neutral-400">
                იგზავნება თქვენი {account.email}-დან და აისახება Titan-ის „გაგზავნილშიც“.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
