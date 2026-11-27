import Link from "next/link";
import { findValidToken } from "@/lib/tokens";
import { setPassword } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "პაროლის დაყენება — GNDSF", robots: { index: false } };

const ERRORS: Record<string, string> = {
  short: "პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.",
  mismatch: "პაროლები არ ემთხვევა.",
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
  const row = token ? await findValidToken(token) : null;
  const field =
    "mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[#005eb8]";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-coal p-8 shadow-sm md:p-10">
        <h1 className="heading-display text-center text-2xl">პაროლის დაყენება</h1>
        {!row ? (
          <div className="mt-6 space-y-4 text-center text-sm text-smoke">
            <p>ბმული არასწორია ან ვადა გაუვიდა.</p>
            <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
              ახალი ბმულის მოთხოვნა
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-center text-sm text-smoke">{row.user.email}</p>
            {error && ERRORS[error] && (
              <p className="mt-6 rounded-lg border border-wine/40 bg-wine/10 px-4 py-3 text-center text-sm font-semibold text-flame">
                {ERRORS[error]}
              </p>
            )}
            <form action={setPassword} className="mt-6 space-y-5">
              <input type="hidden" name="token" value={token} />
              <div>
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-smoke">ახალი პაროლი</label>
                <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} />
              </div>
              <div>
                <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-wider text-smoke">გაიმეორეთ პაროლი</label>
                <input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" className={field} />
              </div>
              <button className="w-full rounded-full bg-[#005eb8] px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90">
                შენახვა
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
