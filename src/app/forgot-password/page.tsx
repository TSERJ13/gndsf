import Link from "next/link";
import { requestReset } from "./actions";

export const metadata = { title: "პაროლის აღდგენა — GNDSF" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-coal p-8 shadow-sm md:p-10">
        <h1 className="heading-display text-center text-2xl">პაროლის აღდგენა</h1>
        {sent ? (
          <p className="mt-6 text-center text-sm text-smoke">
            თუ ეს ელფოსტა რეგისტრირებულია, მასზე აღდგენის ბმული გაიგზავნა. შეამოწმეთ ფოსტა (Spam-იც).
          </p>
        ) : (
          <form action={requestReset} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-smoke">ელფოსტა</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[#005eb8]"
              />
            </div>
            <button className="w-full rounded-full bg-[#005eb8] px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90">
              ბმულის გაგზავნა
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-smoke">
          <Link href="/login" className="font-semibold underline underline-offset-2">შესვლის გვერდზე დაბრუნება</Link>
        </p>
      </div>
    </div>
  );
}
