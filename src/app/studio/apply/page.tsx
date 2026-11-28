import Link from "next/link";
import PhotoInput from "@/components/PhotoInput";
import { submitClubRegistration } from "./actions";

export const metadata = { title: "სტუდიის რეგისტრაცია" };

const ERRORS: Record<string, string> = {
  shortpass: "პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.",
  mismatch: "პაროლები არ ემთხვევა.",
  exists: "ამ ელფოსტით ანგარიში უკვე არსებობს.",
};

// Short form: only what the federation needs to decide. English name,
// address and logo the studio adds later in its panel settings.
export default async function StudioApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  // 16px text keeps iPhone from zooming into the field.
  const input =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[16px] text-gray-900 outline-none transition-colors focus:border-[#8B1E0F] focus:ring-2 focus:ring-[#8B1E0F]/15";
  const label = "text-[14px] font-medium text-gray-700";
  const req = <span className="text-[#B83A14]"> *</span>;

  if (ok === "submitted") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8B1E0F]/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B1E0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-gray-900">განაცხადი მიღებულია</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            დამტკიცებისას ელფოსტაზე მოგივათ შეტყობინება.
          </p>
          <Link href="/" className="mt-6 inline-block text-[14px] font-medium text-[#8B1E0F] hover:underline">
            მთავარ გვერდზე
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <h1 className="text-[26px] font-bold leading-tight text-gray-900 md:text-[30px]">სტუდიის რეგისტრაცია</h1>
      <p className="mt-2 text-[15px] text-gray-600">განაცხადს ფედერაცია განიხილავს.</p>

      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {ERRORS[error] ?? "შეავსეთ სავალდებულო ველები."}
        </p>
      )}

      <form action={submitClubRegistration} className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <div>
          <label className={label} htmlFor="name">სტუდიის სახელი{req}</label>
          <input id="name" name="name" required className={input} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="city">ქალაქი{req}</label>
            <input id="city" name="city" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="phone">ტელეფონი</label>
            <input id="phone" name="phone" type="tel" inputMode="tel" className={input} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="contactName">ხელმძღვანელი{req}</label>
          <input id="contactName" name="contactName" required autoComplete="name" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="logo">ლოგო</label>
          <div className="mt-1.5">
            <PhotoInput id="logo" name="logo" logo />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className={label} htmlFor="email">ელფოსტა{req}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={input} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="password">პაროლი{req}</label>
            <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="მინ. 8 სიმბოლო" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="passwordConfirm">გაიმეორეთ{req}</label>
            <input id="passwordConfirm" name="passwordConfirm" type="password" minLength={8} required autoComplete="new-password" className={input} />
          </div>
        </div>

        <button className="w-full rounded-lg bg-[#8B1E0F] px-4 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#B83A14]">
          გაგზავნა
        </button>
      </form>
    </div>
  );
}
