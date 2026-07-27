"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAthlete } from "./[id]/actions";

export default function DeleteAthleteCardButton({ athleteId }: { athleteId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    const res = await deleteAthlete(athleteId);
    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.error || "წაშლა ვერ მოხერხდა");
      setIsDeleting(false);
      setIsOpen(false);
    }
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="absolute top-3 left-3 bg-red-100/90 hover:bg-red-200 backdrop-blur rounded p-1.5 text-red-600 transition-colors z-10 shadow-sm"
        title="სპორტსმენის წაშლა"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 m-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ნამდვილად გსურთ სპორტსმენის წაშლა?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              ეს ქმედება შეუქცევადია. თუ სპორტსმენი ფიქსირდება ტურნირებზე, წაშლა შეიზღუდება.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                გაუქმება
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? "იშლება..." : "დიახ, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
