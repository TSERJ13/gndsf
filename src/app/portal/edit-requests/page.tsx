import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/labels";
import { approveEditRequest, rejectEditRequest } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "პროფილის შეცვლის მოთხოვნები" };

const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

export default async function EditRequestsPage() {
  const user = await requireStaff();
  
  if (!REGISTRY.includes(user.role)) {
    redirect("/portal");
  }

  const requests = await db.athleteEditRequest.findMany({
    where: { status: "PENDING" },
    include: {
      athlete: true,
      requestedBy: { include: { club: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">პროფილის შეცვლის მოთხოვნები</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 font-semibold">სპორტსმენი</th>
              <th className="px-6 py-4 font-semibold">მოთხოვნილი სახელი/გვარი</th>
              <th className="px-6 py-4 font-semibold">ვინ ითხოვს</th>
              <th className="px-6 py-4 font-semibold text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-neutral-900">{req.athlete.firstName} {req.athlete.lastName}</div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">{req.athlete.gid}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-orange-600">{req.firstName} {req.lastName}</div>
                  {(req.firstNameEn || req.lastNameEn) && (
                    <div className="text-xs text-orange-500 mt-0.5">
                      {req.firstNameEn || ""} {req.lastNameEn || ""}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-neutral-900">{req.requestedBy.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{req.requestedBy.club?.name || "—"}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{fmtDate(req.createdAt)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={rejectEditRequest}>
                      <input type="hidden" name="id" value={req.id} />
                      <button className="rounded px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors">
                        უარყოფა
                      </button>
                    </form>
                    <form action={approveEditRequest}>
                      <input type="hidden" name="id" value={req.id} />
                      <button className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm">
                        დადასტურება
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                  ახალი მოთხოვნები არ არის.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
