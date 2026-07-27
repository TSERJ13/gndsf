"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveRegistration, rejectRegistration } from "../actions";
import { Check, X } from "lucide-react";

export default function ActionButtons({ id }: { id: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' } | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    if (!confirmAction) return;
    
    setIsUpdating(true);
    try {
      if (confirmAction.type === 'approve') {
        await approveRegistration(id);
      } else {
        await rejectRegistration(id);
      }
      router.push("/portal/e-cards");
    } catch (e) {
      alert("დაფიქსირდა შეცდომა");
      setIsUpdating(false);
      setConfirmAction(null);
    }
  }

  return (
    <>
      <div className="mt-8 pt-6 border-t flex justify-end gap-3">
        <button
          onClick={() => setConfirmAction({ type: 'reject' })}
          className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          disabled={isUpdating}
        >
          <X className="w-5 h-5" /> უარყოფა
        </button>
        <button
          onClick={() => setConfirmAction({ type: 'approve' })}
          className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
          disabled={isUpdating}
        >
          <Check className="w-5 h-5" /> დადასტურება
        </button>
      </div>

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
