import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";

export const metadata = { title: "შესვლა" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect((session.user as { role?: string }).role === "ATHLETE" ? "/cabinet" : "/portal");
  }
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/portal",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e; // NEXT_REDIRECT on success
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-coal p-10 md:p-12 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image src="/brand/logo.png" alt="" width={50} height={50} />
          <h1 className="heading-display text-3xl">ადმინისტრირება</h1>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-smoke">
          შედით ფედერაციის ან კლუბის ანგარიშით.
        </p>
        {error && (
          <p className="mt-6 rounded-lg border border-wine/40 bg-wine/10 px-4 py-3 text-center text-sm font-semibold text-flame">
            ელფოსტა ან პაროლი არასწორია. სცადეთ ხელახლა.
          </p>
        )}
        <form action={login} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-smoke">
              ელფოსტა
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[#005eb8]"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-smoke">
              პაროლი
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[#005eb8]"
            />
          </div>
          <button className="mt-2 w-full rounded-full bg-[#005eb8] px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 shadow-sm">
            შესვლა
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-smoke">
          ჯერ არ ხართ დარეგისტრირებული სტუდია?{" "}
          <Link href="/studio/apply" className="font-semibold underline underline-offset-2">
            დარეგისტრირდით აქ
          </Link>
        </p>
      </div>
    </div>
  );
}
