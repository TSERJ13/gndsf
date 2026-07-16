import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { decrypt } from "@/lib/crypto";
import { readMessage } from "@/lib/mailbox";
import { composeMail } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "წერილი · ფოსტა" };

const fmtDT = (d: Date) =>
  new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function MailMessage({
  params,
  searchParams,
}: {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ box?: string }>;
}) {
  const user = await requireStaff();
  const { uid } = await params;
  const { box: boxParam } = await searchParams;
  const box = boxParam === "sent" ? "sent" : "inbox";

  const account = await db.mailAccount.findUnique({ where: { userId: user.id } });
  if (!account) notFound();

  let msg;
  try {
    msg = await readMessage(account.email, decrypt(account.encSecret), box, Number(uid));
  } catch (e) {
    console.error("mail read failed:", e);
  }
  if (!msg) notFound();

  // "Name <addr@x>" → addr@x ; plain address stays as is
  const replyTo = (msg.from.match(/<([^>]+)>/)?.[1] ?? msg.from).trim();

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/mail?box=${box}`} className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {box === "inbox" ? "შემოსული" : "გაგზავნილი"}
      </Link>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h1 className="text-lg font-semibold">{msg.subject}</h1>
          <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
            <div><span className="text-neutral-400">ვისგან:</span> {msg.from}</div>
            <div><span className="text-neutral-400">ვის:</span> {msg.to}</div>
            {msg.date && (
              <div className="tabular-nums"><span className="text-neutral-400">დრო:</span> {fmtDT(msg.date)}</div>
            )}
          </div>
          {msg.attachments.length > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              📎 დანართები ({msg.attachments.length}): {msg.attachments.join(", ")} — გასახსნელად გამოიყენეთ Titan-ის ვებმეილი.
            </p>
          )}
        </div>
        {/* plain text only — HTML from strangers never renders in the admin */}
        <pre className="whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-neutral-800">
          {msg.text || "(ცარიელი წერილი)"}
        </pre>
      </div>

      {box === "inbox" && (
        <form action={composeMail} className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">პასუხი</h2>
          <input type="hidden" name="to" value={replyTo} />
          <input
            type="hidden"
            name="subject"
            value={msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`}
          />
          <p className="mt-1 text-xs text-neutral-500">მიმღები: {replyTo}</p>
          <textarea
            name="body"
            rows={6}
            required
            placeholder="თქვენი პასუხი…"
            className="mt-3 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <button className="mt-3 rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">
            პასუხის გაგზავნა
          </button>
        </form>
      )}
    </div>
  );
}
