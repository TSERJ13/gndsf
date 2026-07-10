export const metadata = { title: "კონტაქტი" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">კონტაქტი</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-coal p-5">
          <h2 className="font-semibold">ფედერაცია</h2>
          <p className="mt-2 text-sm text-smoke">info@gndsf.ge</p>
        </div>
        <div className="rounded-lg border border-line bg-coal p-5">
          <h2 className="font-semibold">პრეზიდენტი</h2>
          <p className="mt-2 text-sm text-smoke">
            <a href="mailto:president@gndsf.ge" className="hover:text-wine">president@gndsf.ge</a>
          </p>
        </div>
        <div className="rounded-lg border border-line bg-coal p-5">
          <h2 className="font-semibold">გენერალური მდივანი</h2>
          <p className="mt-2 text-sm text-smoke">
            <a href="mailto:secretary@gndsf.ge" className="hover:text-wine">secretary@gndsf.ge</a>
          </p>
        </div>
      </div>
      <p className="mt-6 text-sm text-smoke">
        საკონტაქტო ფორმა და ოფიციალური პირების სრული დირექტორია დაემატება Phase 4-ში.
      </p>
    </div>
  );
}
