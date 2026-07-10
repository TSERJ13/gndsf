import Image from "next/image";
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
    redirect((session.user as { role?: string }).role === "ATHLETE" ? "/cabinet" : "/admin");
  }
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/admin",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e; // NEXT_REDIRECT on success
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="rounded-lg border border-line bg-coal p-8">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="" width={34} height={34} />
          <h1 className="text-lg font-semibold">ადმინისტრირება</h1>
        </div>
        <p className="mt-2 text-sm text-smoke">
          შედით ფედერაციის ან კლუბის ანგარიშით.
        </p>
        {error && (
          <p className="mt-4 rounded border border-wine/40 bg-wine/10 px-3 py-2 text-sm text-flame">
            ელფოსტა ან პაროლი არასწორია. სცადეთ ხელახლა.
          </p>
        )}
        <form action={login} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-wider text-smoke">
              ელფოსტა
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-wider text-smoke">
              პაროლი
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <button className="w-full rounded bg-wine px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-flame">
            შესვლა
          </button>
        </form>
      </div>
    </div>
  );
}
