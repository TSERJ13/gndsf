import { submitContact } from "./actions";

export const metadata = { title: "კონტაქტი" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  const input =
    "mt-1 w-full rounded border border-line bg-coal px-3 py-2 text-sm outline-none placeholder:text-smoke focus:border-wine";
  const label = "text-xs uppercase tracking-wider text-smoke";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">კონტაქტი</h1>

      <div className="mt-8 grid gap-10 md:grid-cols-[320px_1fr]">
        <div>
          <div className="rounded-lg border border-line bg-coal p-5">
            <h2 className="font-semibold">ფედერაცია</h2>
            <p className="mt-2 text-sm">
              <a href="mailto:contact@gndsf.ge" className="text-wine hover:text-flame">
                contact@gndsf.ge
              </a>
            </p>
            <p className="mt-3 text-xs text-smoke">
              წერილს ფედერაციის პასუხისმგებელი პირები იღებენ და უმოკლეს ვადაში
              გიპასუხებენ.
            </p>
          </div>
        </div>

        <div>
          {ok && (
            <p className="mb-4 rounded border border-green-500/40 bg-green-500/5 px-4 py-3 text-sm text-green-500">
              შეტყობინება გაიგზავნა — მადლობა! პასუხს მითითებულ ელფოსტაზე მიიღებთ.
            </p>
          )}
          {error && (
            <p className="mb-4 rounded border border-wine/40 bg-wine/5 px-4 py-3 text-sm text-flame">
              {error === "fields"
                ? "შეავსეთ ყველა ველი — შეტყობინება მინიმუმ 10 სიმბოლო."
                : error === "send"
                  ? "გაგზავნა ვერ მოხერხდა — სცადეთ მოგვიანებით ან მოგვწერეთ პირდაპირ contact@gndsf.ge-ზე."
                  : "ფორმა დროებით მიუწვდომელია — მოგვწერეთ პირდაპირ contact@gndsf.ge-ზე."}
            </p>
          )}

          <form action={submitContact} className="space-y-4 rounded-lg border border-line bg-coal p-5">
            {/* honeypot — hidden from humans, bots fill it */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="c-name">სახელი</label>
                <input id="c-name" name="name" required maxLength={100} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-email">ელფოსტა</label>
                <input id="c-email" name="email" type="email" required className={input} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="c-subject">თემა</label>
              <input id="c-subject" name="subject" required maxLength={150} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="c-message">შეტყობინება</label>
              <textarea
                id="c-message"
                name="message"
                rows={6}
                required
                minLength={10}
                maxLength={5000}
                className={input}
              />
            </div>
            <button className="rounded bg-wine px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-flame">
              გაგზავნა
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
