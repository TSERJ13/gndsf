import { db } from "@/lib/db";
import { requireUser, clubScope } from "@/lib/rbac";
import CategoryTransitions from "@/components/CategoryTransitions";
import TodoList from "./TodoList";
import WorkspaceCalendar from "./WorkspaceCalendar";

export const dynamic = "force-dynamic";
export const metadata = { title: "სამუშაო სივრცე" };

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ notify?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const { notify } = await searchParams;

  const tasks = await db.adminTask.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const competitions = await db.competition.findMany({
    select: { id: true, name: true, startDate: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900">სამუშაო სივრცე</h1>
        <p className="text-sm font-medium text-neutral-500">
          თქვენი ყოველდღიური ხელსაწყოები და პერსონალური სივრცე
        </p>
      </div>

      {notify === "failed" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          შეტყობინების გაგზავნა ვერ მოხერხდა — სცადეთ ხელახლა.
        </p>
      )}
      {notify === "config" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ფოსტის გაგზავნა არ არის კონფიგურირებული (SMTP).
        </p>
      )}

      <div className="mt-6">
        <CategoryTransitions
          clubId={user.role === "CLUB_MANAGER" ? (user.clubId ?? null) : null}
          role={user.role}
          notified={notify === "sent"}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Notes Column */}
        <div className="flex flex-col min-h-[500px]">
          <div className="flex-1 rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-neutral-100 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B1E0F] to-[#c49a5b] opacity-80"></div>
            <TodoList initialTasks={tasks} />
          </div>
        </div>
        
        {/* Calendar Column */}
        <div className="flex flex-col">
          <div className="rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-neutral-100 p-6 relative overflow-hidden">
            <h2 className="mb-6 text-lg font-bold text-neutral-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c49a5b]"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              კალენდარი
            </h2>
            <WorkspaceCalendar competitions={competitions} />
          </div>
        </div>
      </div>
    </div>
  );
}
