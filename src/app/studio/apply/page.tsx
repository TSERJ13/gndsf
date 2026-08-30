import { submitClubRegistration } from "./actions";

export const metadata = { title: "სტუდიის რეგისტრაცია" };

export default async function StudioApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  const input =
    "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-smoke";

  if (ok === "submitted") {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-line bg-coal p-10 text-center shadow-sm">
          <h1 className="heading-display text-2xl">განაცხადი მიღებულია</h1>
          <p className="mt-4 text-sm text-smoke">
            თქვენი სტუდიის რეგისტრაციის მოთხოვნა გადაეგზავნა ფედერაციას
            განსახილველად. დამტკიცების შემდეგ შეძლებთ შესვლას იმ
            ელფოსტითა და პაროლით, რომელიც ახლა მიუთითეთ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-coal p-8 md:p-10 shadow-sm">
        <h1 className="heading-display text-2xl text-center">სტუდიის რეგისტრაცია</h1>
        <p className="mt-2 text-center text-sm text-smoke">
          დაარეგისტრირეთ თქვენი საცეკვაო სტუდია/კლუბი GNDSF-ში. განაცხადს
          განიხილავს ფედერაცია — დამტკიცების შემდეგ შეძლებთ სპორტსმენების
          რეგისტრაციასა და წყვილების შექმნას საკუთარი კლუბის ფარგლებში.
        </p>

        {error && (
          <p className="mt-6 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error === "shortpass"
              ? "პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს."
              : error === "mismatch"
                ? "პაროლები არ ემთხვევა."
                : error === "exists"
                  ? "ამ ელფოსტით განაცხადი ან ანგარიში უკვე არსებობს."
                  : "შეავსეთ ყველა სავალდებულო ველი."}
          </p>
        )}

        <form action={submitClubRegistration} className="mt-6 space-y-4">
          <div>
            <label className={label} htmlFor="name">სტუდიის/კლუბის დასახელება</label>
            <input id="name" name="name" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="nameEn">დასახელება (ინგლისურად, არასავალდებულო)</label>
            <input id="nameEn" name="nameEn" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="city">ქალაქი</label>
              <input id="city" name="city" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="phone">ტელეფონი</label>
              <input id="phone" name="phone" className={input} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="address">მისამართი</label>
            <input id="address" name="address" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="contactName">საკონტაქტო პირი (ხელმძღვანელი/მწვრთნელი)</label>
            <input id="contactName" name="contactName" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="email">ელფოსტა (შესვლისთვის)</label>
            <input id="email" name="email" type="email" required className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="password">პაროლი</label>
              <input id="password" name="password" type="password" minLength={8} required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="passwordConfirm">გაიმეორეთ პაროლი</label>
              <input id="passwordConfirm" name="passwordConfirm" type="password" minLength={8} required className={input} />
            </div>
          </div>
          <button className="w-full rounded bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
            განაცხადის გაგზავნა
          </button>
        </form>
      </div>
    </div>
  );
}
