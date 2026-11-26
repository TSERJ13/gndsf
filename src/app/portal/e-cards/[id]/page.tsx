import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import ActionButtons from "./ActionButtons";
import { resolveStoredFile, type ResolvedDoc } from "@/lib/storage";

function FilePreview({ file, alt }: { file: ResolvedDoc; alt: string }) {
  if (!file) {
    return <div className="text-sm text-gray-400 py-6 text-center bg-white rounded border border-dashed">არ არის ატვირთული</div>;
  }
  return (
    <a href={file.url} target="_blank" rel="noreferrer noopener" className="block w-full">
      {file.isPdf ? (
        <div className="w-full h-32 bg-white border flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
          <span className="font-bold text-gray-600">PDF დოკუმენტის ნახვა</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={alt} className="w-full h-56 object-cover rounded hover:opacity-90 transition-opacity border" />
      )}
    </a>
  );
}

export default async function ECardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);
  
  const { id } = await params;

  const reg = await db.athleteRegistration.findUnique({
    where: { id: id },
    include: { club: true }
  });

  if (!reg) {
    return notFound();
  }

  // Documents live in a private bucket: links below expire after 10 minutes.
  const [photo, idDoc, agreement, parentId] = await Promise.all([
    resolveStoredFile(reg.profilePictureUrl),
    resolveStoredFile(reg.idDocumentUrl),
    resolveStoredFile(reg.signedAgreementUrl),
    resolveStoredFile(reg.parentIdDocumentUrl),
  ]);

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
                  <FilePreview file={photo} alt="Profile" />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> პირადობა / დაბადების მოწმობა</span>
                  <FilePreview file={idDoc} alt="ID Document" />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> ხელმოწერილი წესდება</span>
                  <FilePreview file={agreement} alt="Signed Agreement" />
                </div>

                {reg.isParentConsentRequired && (
                  <div className="bg-yellow-50/30 p-4 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-yellow-800 mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4"/> მშობლის პირადობა</span>
                    <FilePreview file={parentId} alt="Parent ID Document" />
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
