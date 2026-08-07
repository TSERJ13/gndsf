import Image from "next/image";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-black px-6 select-none">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <Image
            src="/brand/logo-header@2x.png"
            alt="GNDSF Logo"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
        </div>

        {/* Simple elegant message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            საიტი განახლების პროცესშია
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-medium">
            Web Site is under construction
          </p>
        </div>

        {/* Clean divider and footer */}
        <div className="pt-4 border-t border-gray-100 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B1E0F]">
            Georgian National Dancesport Federation
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            საქართველოს სპორტცეკვების ეროვნული ფედერაცია
          </p>
        </div>
      </div>
    </div>
  );
}


