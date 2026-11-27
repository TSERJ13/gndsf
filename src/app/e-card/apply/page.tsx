import Link from "next/link";

export const metadata = { title: "E-CARD — GNDSF" };

// Athletes are registered by their club (federation decision): the
// E-CARD is issued automatically once the federation approves.
export default function ECardInfoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="heading-display text-3xl">GNDSF E-CARD</h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-gray-700">
        <p>ათლეტს რეგისტრაციაში ატარებს მისი კლუბი (სტუდია) — ფედერაციის პორტალიდან.</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>კლუბი ავსებს ათლეტის მონაცემებს და ტვირთავს დოკუმენტს.</li>
          <li>ფედერაცია ამოწმებს და ამტკიცებს.</li>
          <li>ათლეტი იღებს GID ნომერს და E-CARD-ს, ხოლო ელფოსტაზე — ბმულს პირად კაბინეტში შესასვლელად.</li>
        </ol>
        <p>თუ თქვენი სტუდია ჯერ არ არის ფედერაციის წევრი, ჯერ დაარეგისტრირეთ სტუდია.</p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/studio/apply" className="rounded-full bg-[#B83A14] px-6 py-3 text-sm font-bold text-white hover:bg-[#8B1E0F]">
          სტუდიის რეგისტრაცია
        </Link>
        <Link href="/login" className="rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-black hover:border-black">
          კაბინეტში შესვლა
        </Link>
      </div>
    </div>
  );
}
