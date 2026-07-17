import { db } from "@/lib/db";
import { requireUser, clubScope } from "@/lib/rbac";
import CategoryTransitions from "@/components/CategoryTransitions";
import TodoList from "./TodoList";
import Calculator from "./Calculator";
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
      <h1 className="text-2xl font-semibold">სამუშაო სივრცე</h1>
      <p className="mt-1 text-sm text-neutral-500">
        ხელსაწყოები და თქვენი პირადი ჩანაწერები
      </p>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              თქვენი დავალებები (To-Do)
            </h2>
            <TodoList initialTasks={tasks} />
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              კალენდარი
            </h2>
            <WorkspaceCalendar competitions={competitions} />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              კალკულატორი
            </h2>
            <Calculator />
          </div>
        </div>
      </div>
    </div>
  );
}
