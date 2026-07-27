import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import ActionButtons from "./ActionButtons";

export default async function ECardDetailPage({ params }: { params: { id: string } }) {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  const reg = await db.athleteRegistration.findUnique({
    where: { id: params.id },
    include: { club: true }
  });

  if (!reg) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/portal/e-cards" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> დაბრუნება სიაში
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">განაცხადის დეტალები</h1>
            <p className="text-sm text-gray-500 mt-1">
              წარმოდგენილია: {reg.createdAt.toLocaleDateString("ka-GE")}
            </p>
          </div>
          <div>
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                reg.status === "PENDING"
                  ? "bg-orange-100 text-orange-700"
                  : reg.status === "APPROVED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {reg.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Info Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                პირადი ინფორმაცია
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">სახელი, გვარი</dt>
                  <dd className="font-medium text-gray-900">
                    {reg.firstName} {reg.lastName}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">პირადი ნომერი</dt>
                  <dd className="font-medium text-gray-900">{reg.personalNumber}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">დაბ. თარიღი</dt>
                  <dd className="font-medium text-gray-900">
                    {reg.birthDate.toLocaleDateString("ka-GE")}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">სქესი</dt>
                  <dd className="font-medium text-gray-900">
                    {reg.gender === "MALE" ? "მამრობითი" : "მდედრობითი"}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">ელ-ფოსტა</dt>
                  <dd className="font-medium text-gray-900">{reg.email}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">ტელეფონი</dt>
                  <dd className="font-medium text-gray-900">{reg.phone || "—"}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">კლუბი</dt>
                  <dd className="font-medium text-gray-900">{reg.club?.name || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Files Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                ატვირთული ფაილები
              </h3>
              
              <div className="space-y-5">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> ფოტოსურათი</span>
                  {reg.profilePictureUrl ? (
                    <a href={reg.profilePictureUrl} target="_blank" rel="noreferrer" className="block w-full">
                      <img src={reg.profilePictureUrl} alt="Profile" className="w-full h-56 object-cover rounded hover:opacity-90 transition-opacity border" />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400 py-6 text-center bg-white rounded border border-dashed">არ არის ატვირთული</div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> პირადობა / დაბადების მოწმობა</span>
                  {reg.idDocumentUrl ? (
                    <a href={reg.idDocumentUrl} target="_blank" rel="noreferrer" className="block w-full">
                      <img src={reg.idDocumentUrl} alt="ID Document" className="w-full h-56 object-cover rounded hover:opacity-90 transition-opacity border" />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400 py-6 text-center bg-white rounded border border-dashed">არ არის ატვირთული</div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> ხელმოწერილი წესდება</span>
                  {reg.signedAgreementUrl ? (
                    <a href={reg.signedAgreementUrl} target="_blank" rel="noreferrer" className="block w-full">
                      {reg.signedAgreementUrl.endsWith('.pdf') ? (
                        <div className="w-full h-32 bg-white border flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                           <span className="font-bold text-gray-600">PDF დოკუმენტის ნახვა</span>
                        </div>
                      ) : (
                        <img src={reg.signedAgreementUrl} alt="Signed Agreement" className="w-full h-56 object-cover rounded hover:opacity-90 transition-opacity border" />
                      )}
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400 py-6 text-center bg-white rounded border border-dashed">არ არის ატვირთული</div>
                  )}
                </div>

                {reg.isParentConsentRequired && (
                  <div className="bg-yellow-50/30 p-4 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-yellow-800 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> მშობლის პირადობა</span>
                    {reg.parentIdDocumentUrl ? (
                      <a href={reg.parentIdDocumentUrl} target="_blank" rel="noreferrer" className="block w-full">
                        <img src={reg.parentIdDocumentUrl} alt="Parent ID Document" className="w-full h-56 object-cover rounded hover:opacity-90 transition-opacity border" />
                      </a>
                    ) : (
                      <div className="text-sm text-gray-400 py-6 text-center bg-white rounded border border-dashed">არ არის ატვირთული</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons via Client Component */}
        {reg.status === "PENDING" && (
          <ActionButtons id={reg.id} />
        )}
      </div>
    </div>
  );
}
