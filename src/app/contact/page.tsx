import { submitContact } from "./actions";

export const metadata = { title: "კონტაქტი" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  const input =
    "mt-2 w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-[15px] outline-none placeholder:text-gray-400 transition-all focus:border-[#c49a5b] focus:ring-4 focus:ring-[#c49a5b]/10 shadow-sm";
  const label = "text-[12px] font-bold uppercase tracking-widest text-gray-500";

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-16 lg:pt-24 pb-20 motion-fade-up">
      <h1 className="heading-display text-center text-4xl lg:text-5xl mb-14">კონტაქტი</h1>

      <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
        <div className="motion-fade-up motion-delay-1">
          <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-black mb-4">GNDSF</h2>
            <div className="space-y-4 text-[15px]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-[#005eb8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">ელფოსტა</div>
                  <a href="mailto:contact@gndsf.ge" className="font-medium text-black hover:text-[#c49a5b] transition-colors">
                    contact@gndsf.ge
                  </a>
                </div>
              </div>
            </div>
            
            <hr className="my-6 border-gray-100" />
            
            <p className="text-sm leading-relaxed text-gray-500">
              თქვენს წერილს ფედერაციის პასუხისმგებელი პირები იღებენ. უმოკლეს ვადაში დაგიკავშირდებით მითითებულ ელფოსტაზე.
            </p>
          </div>
        </div>

        <div className="motion-fade-up motion-delay-2">
          {ok && (
            <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <p className="text-[15px] font-bold text-green-700 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                შეტყობინება გაიგზავნა — მადლობა! პასუხს მითითებულ ელფოსტაზე მიიღებთ.
              </p>
            </div>
          )}
          {error && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-[15px] font-bold text-red-600 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error === "fields"
                  ? "შეავსეთ ყველა ველი — შეტყობინება მინიმუმ 10 სიმბოლო."
                  : error === "send"
                    ? "გაგზავნა ვერ მოხერხდა — სცადეთ მოგვიანებით ან მოგვწერეთ პირდაპირ contact@gndsf.ge-ზე."
                    : "ფორმა დროებით მიუწვდომელია — მოგვწერეთ პირდაპირ contact@gndsf.ge-ზე."}
              </p>
            </div>
          )}

          <form action={submitContact} className="space-y-6 rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="c-name">სახელი, გვარი</label>
                <input id="c-name" name="name" required maxLength={100} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-email">ელფოსტა</label>
                <input id="c-email" name="email" type="email" required className={input} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="c-subject">თემა / Subject</label>
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
                className={`${input} resize-y min-h-[150px]`}
              />
            </div>
            <button className="w-full md:w-auto rounded-full bg-[#005eb8] px-10 py-4 text-[15px] font-bold tracking-widest uppercase text-white shadow-md transition-transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#005eb8]/20">
              შეტყობინების გაგზავნა
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
