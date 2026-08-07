import Image from "next/image";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070b19] text-white px-6 overflow-hidden select-none">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#B83A14]/15 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#005eb8]/15 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none animate-pulse duration-5000" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Glass Container */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-8 py-12 px-6 sm:px-12 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl shadow-2xl">
        {/* Animated Brand Logo Container */}
        <div className="relative inline-block">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#B83A14] to-[#005eb8] opacity-60 blur-md animate-pulse" />
          <div className="relative bg-[#070b19] p-5 rounded-full border border-white/10 flex items-center justify-center">
            <Image
              src="/brand/logo-header@2x.png"
              alt="GNDSF Logo"
              width={90}
              height={90}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Construction Tag */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#B83A14]/10 text-[#ff7b5a] border border-[#B83A14]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B83A14] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B83A14]" />
            </span>
            Under Construction
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            საიტი განახლების პროცესშია
          </h1>
          
          <p className="text-gray-400 text-sm sm:text-[15px] font-medium max-w-md mx-auto leading-relaxed">
            ჩვენ ვმუშაობთ ვებ-გვერდის ახალ ვერსიაზე. სრული ფუნქციონალი მალე ხელმისაწვდომი იქნება.
          </p>
        </div>

        {/* Divider Deco */}
        <div className="flex justify-center items-center gap-3 py-2">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#B83A14]/40" />
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Footer Brand Info */}
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
            Georgian National Dance Sport Federation
          </p>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
            საქართველოს სპორტცეკვების ეროვნული ფედერაცია
          </p>
        </div>
      </div>
    </div>
  );
}

