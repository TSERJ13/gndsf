// Shared photo blocks: a real photo when there is one, otherwise the
// silhouette placeholder that was used everywhere before.

function Silhouette({ female, size = 48, className = "text-gray-400" }: { female: boolean; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
      {female ? (
        <>
          <path d="M 22 32 C 22 46, 42 46, 42 32" />
          <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
        </>
      ) : (
        <>
          <path d="M 20 26 C 20 44, 44 44, 44 26" />
          <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
        </>
      )}
    </svg>
  );
}

type Person = { photoUrl?: string | null; gender?: string | null; firstName?: string; lastName?: string };

/** Fills its parent (give the parent an aspect ratio). */
export function AthletePhoto({ athlete }: { athlete: Person }) {
  if (athlete.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={athlete.photoUrl} alt={`${athlete.firstName ?? ""} ${athlete.lastName ?? ""}`.trim()} loading="lazy" className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <Silhouette female={athlete.gender === "FEMALE"} />
    </div>
  );
}

/** Couple photo, or both partners' photos side by side, or silhouettes. */
export function CouplePhoto({
  couple,
}: {
  couple: { photoUrl?: string | null; leader: Person; follower: Person };
}) {
  if (couple.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={couple.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />;
  }
  if (couple.leader.photoUrl || couple.follower.photoUrl) {
    return (
      <div className="grid h-full w-full grid-cols-2">
        <AthletePhoto athlete={couple.leader} />
        <AthletePhoto athlete={couple.follower} />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center gap-4 bg-gray-100">
      <Silhouette female={false} />
      <Silhouette female={true} />
    </div>
  );
}
