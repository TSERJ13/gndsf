"use client";

import { useState } from "react";
import { approveRegistration, rejectRegistration } from "./actions";
import { Check, X, Eye, Image as ImageIcon } from "lucide-react";

type Registration = {
  id: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  personalNumber: string;
  gender: string;
  birthDate: Date;
  profilePictureUrl: string | null;
  idDocumentUrl: string | null;
  isParentConsentRequired: boolean;
  parentName: string | null;
  signedAgreementUrl: string | null;
  createdAt: Date;
  club?: { name: string } | null;
};

export default function ECardList({
  registrations,
}: {
  registrations: Registration[];
}) {
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: string } | null>(null);

  async function handleConfirm() {
    if (!confirmAction) return;
    
    setIsUpdating(true);
    try {
      if (confirmAction.type === 'approve') {
        await approveRegistration(confirmAction.id);
      } else {
        await rejectRegistration(confirmAction.id);
      }
      setSelectedReg(null);
    } catch (e) {
      alert("დაფიქსირდა შეცდომა");
    } finally {
      setIsUpdating(false);
      setConfirmAction(null);
    }
  }

  function promptApprove(id: string) {
    setConfirmAction({ type: 'approve', id });
  }

  function promptReject(id: string) {
    setConfirmAction({ type: 'reject', id });
  }

  return (
    <>
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">სპორტსმენი</th>
              <th className="px-4 py-3 font-semibold text-gray-600">პირადი №</th>
              <th className="px-4 py-3 font-semibold text-gray-600">ასაკი (მშობელი)</th>
              <th className="px-4 py-3 font-semibold text-gray-600">კლუბი</th>
              <th className="px-4 py-3 font-semibold text-gray-600">სტატუსი</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  განაცხადები არ მოიძებნა
                </td>
              </tr>
            ) : (
              registrations.map((reg) => {
                const isUnder18 = reg.isParentConsentRequired;

                return (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {reg.firstName} {reg.lastName}
                      <div className="text-xs text-gray-500">{reg.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{reg.personalNumber}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {isUnder18 ? (
                        <span className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs">
                          არასრულწლოვანი
                        </span>
                      ) : (
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                          სრულწლოვანი
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {reg.club?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          reg.status === "PENDING"
                            ? "bg-orange-100 text-orange-700"
                            : reg.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> ნახვა
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-xl p-6 md:p-8 m-auto my-8">
            <button
              onClick={() => setSelectedReg(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 border-b pb-2">
              განაცხადის დეტალები
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Info Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    პირადი ინფორმაცია
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">სახელი, გვარი</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedReg.firstName} {selectedReg.lastName}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">პირადი ნომერი</dt>
                      <dd className="font-medium text-gray-900">{selectedReg.personalNumber}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">დაბ. თარიღი</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(selectedReg.birthDate).toLocaleDateString("ka-GE")}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">სქესი</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedReg.gender === "MALE" ? "მამრობითი" : "მდედრობითი"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">ელ-ფოსტა</dt>
                      <dd className="font-medium text-gray-900">{selectedReg.email}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">ტელეფონი</dt>
                      <dd className="font-medium text-gray-900">{selectedReg.phone || "—"}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <dt className="text-gray-600">კლუბი</dt>
                      <dd className="font-medium text-gray-900">{selectedReg.club?.name || "—"}</dd>
                    </div>
                  </dl>
                </div>

                {selectedReg.isParentConsentRequired && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                    <h3 className="text-sm font-semibold text-yellow-800 uppercase tracking-wider mb-2">
                      მშობლის თანხმობა
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-yellow-200 pb-1">
                        <dt className="text-yellow-700">მშობლის სახელი</dt>
                        <dd className="font-medium text-yellow-900">{selectedReg.parentName}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>

              {/* Files Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    ატვირთული ფაილები
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border">
                      <span className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1"><ImageIcon className="w-3 h-3"/> ფოტოსურათი</span>
                      {selectedReg.profilePictureUrl ? (
                        <a href={selectedReg.profilePictureUrl} target="_blank" rel="noreferrer" className="block w-full">
                          <img src={selectedReg.profilePictureUrl} alt="Profile" className="w-full h-48 object-cover rounded hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="text-sm text-gray-400 py-4 text-center">არ არის ატვირთული</div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <span className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1"><ImageIcon className="w-3 h-3"/> პირადობა / დაბადების მოწმობა</span>
                      {selectedReg.idDocumentUrl ? (
                        <a href={selectedReg.idDocumentUrl} target="_blank" rel="noreferrer" className="block w-full">
                          <img src={selectedReg.idDocumentUrl} alt="ID Document" className="w-full h-48 object-cover rounded hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="text-sm text-gray-400 py-4 text-center">არ არის ატვირთული</div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <span className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1"><ImageIcon className="w-3 h-3"/> ხელმოწერილი წესდება</span>
                      {selectedReg.signedAgreementUrl ? (
                        <a href={selectedReg.signedAgreementUrl} target="_blank" rel="noreferrer" className="block w-full">
                          {selectedReg.signedAgreementUrl.endsWith('.pdf') ? (
                            <div className="w-full h-24 bg-gray-200 flex items-center justify-center rounded hover:bg-gray-300">
                               <span className="font-bold text-gray-600">PDF დოკუმენტის ნახვა</span>
                            </div>
                          ) : (
                            <img src={selectedReg.signedAgreementUrl} alt="Signed Agreement" className="w-full h-48 object-cover rounded hover:opacity-90 transition-opacity" />
                          )}
                        </a>
                      ) : (
                        <div className="text-sm text-gray-400 py-4 text-center">არ არის ატვირთული</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isUpdating}
              >
                დახურვა
              </button>
              
              {selectedReg.status === "PENDING" && (
                <>
                  <button
                    onClick={() => promptReject(selectedReg.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4" /> უარყოფა
                  </button>
                  <button
                    onClick={() => promptApprove(selectedReg.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 shadow-sm"
                    disabled={isUpdating}
                  >
                    <Check className="w-4 h-4" /> დადასტურება
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 m-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ნამდვილად გსურთ {confirmAction.type === 'approve' ? 'დადასტურება' : 'უარყოფა'}?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              ეს ქმედება შეცვლის განაცხადის სტატუსს ბაზაში.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isUpdating}
              >
                გაუქმება
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
                  confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isUpdating}
              >
                {isUpdating ? 'მიმდინარეობს...' : 'დიახ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
