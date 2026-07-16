import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { decrypt } from "@/lib/crypto";
import { readMessage } from "@/lib/mailbox";
import { composeMail, deleteMailAction } from "../../actions";
import sanitizeHtml from "sanitize-html";

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
  const box = boxParam === "sent" ? "sent" : boxParam === "spam" ? "spam" : boxParam === "trash" ? "trash" : "inbox";

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

  const safeHtml = msg.html
    ? sanitizeHtml(msg.html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "style", "html", "body", "head"]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          "*": ["style", "class"],
          img: ["src", "alt", "width", "height"],
          a: ["href", "name", "target"],
        },
      })
    : "";

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/mail?box=${box}`} className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {box === "inbox" ? "შემოსული" : box === "spam" ? "სპამი" : box === "trash" ? "წაშლილი" : "გაგზავნილი"}
      </Link>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex justify-between items-start border-b border-neutral-200 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold">{msg.subject}</h1>
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
          <form action={deleteMailAction.bind(null, Number(uid), box as any)}>
            <button className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md">
              {box === "trash" ? "საბოლოოდ წაშლა" : "წაშლა"}
            </button>
          </form>
        </div>
        
        {safeHtml ? (
          <div 
            className="prose prose-sm max-w-none px-5 py-6 text-neutral-800"
            dangerouslySetInnerHTML={{ __html: safeHtml }} 
          />
        ) : (
          <pre className="whitespace-pre-wrap px-5 py-6 font-sans text-sm leading-relaxed text-neutral-800">
            {msg.text || "(ცარიელი წერილი)"}
          </pre>
        )}
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
