"use client";

import { useTransition, useState } from "react";
import { Check, Trash2, Plus, X, StickyNote } from "lucide-react";
import { addTask, toggleTask, deleteTask } from "./actions";
import { AdminTask } from "@prisma/client";

export default function TodoList({ initialTasks }: { initialTasks: AdminTask[] }) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = (id: string, current: boolean) => {
    startTransition(() => {
      toggleTask(id, !current);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      deleteTask(id);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <StickyNote className="text-[#8B1E0F]" size={20} />
          პირადი ჩანაწერები
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm font-medium text-[#8B1E0F] hover:bg-[#8B1E0F]/10 px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={16} />
            დამატება
          </button>
        )}
      </div>

      {isAdding && (
        <form action={(formData) => {
          addTask(formData);
          setIsAdding(false);
        }} className="mb-6 p-4 bg-[#fdfaf6] border border-[#e8dcc7] rounded-xl relative shadow-inner">
          <button type="button" onClick={() => setIsAdding(false)} className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-red-500">
            <X size={16} />
          </button>
          <label className="block text-xs font-bold text-[#8B1E0F] uppercase tracking-wider mb-2">ახალი ჩანაწერი</label>
          <textarea
            name="text"
            placeholder="რისი დამახსოვრება გსურთ?"
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm resize-none outline-none text-neutral-800 placeholder:text-neutral-400"
            rows={3}
            autoFocus
            required
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="bg-[#8B1E0F] text-white px-4 py-1.5 rounded-md text-xs font-bold tracking-wider hover:bg-[#6a150b] transition-colors"
            >
              შენახვა
            </button>
          </div>
        </form>
      )}

      {initialTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-50">
          <StickyNote size={48} className="mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">
            ჩანაწერები არ გაქვთ
          </p>
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
          {initialTasks.map((task) => (
            <li
              key={task.id}
              className={`group relative flex items-start gap-3 rounded-xl border p-4 transition-all ${
                task.isDone 
                  ? "border-green-100 bg-green-50/50" 
                  : "border-[#e8dcc7] bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <button
                onClick={() => handleToggle(task.id, task.isDone)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  task.isDone ? "border-green-500 bg-green-500 text-white" : "border-[#c49a5b] hover:bg-[#c49a5b]/10"
                }`}
              >
                {task.isDone && <Check size={12} strokeWidth={3} />}
              </button>
              <span
                className={`text-sm leading-relaxed break-words flex-1 transition-all ${
                  task.isDone ? "line-through text-neutral-400" : "text-neutral-700 font-medium"
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
