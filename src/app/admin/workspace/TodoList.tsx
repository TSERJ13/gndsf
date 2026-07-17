"use client";

import { useTransition } from "react";
import { Check, Trash2, Plus } from "lucide-react";
import { addTask, toggleTask, deleteTask } from "./actions";
import { AdminTask } from "@prisma/client";

export default function TodoList({ initialTasks }: { initialTasks: AdminTask[] }) {
  const [isPending, startTransition] = useTransition();

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
    <div>
      <form action={addTask} className="flex gap-2 mb-4">
        <input
          type="text"
          name="text"
          placeholder="ახალი დავალება..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-wine focus:ring-1 focus:ring-wine"
          required
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1 rounded-md bg-wine px-3 py-2 text-sm font-medium text-white hover:bg-wine/90"
        >
          <Plus size={16} />
          დამატება
        </button>
      </form>

      {initialTasks.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-200 rounded-md">
          ჩანაწერები არ გაქვთ.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {initialTasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors ${
                task.isDone ? "border-green-200 bg-green-50" : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handleToggle(task.id, task.isDone)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    task.isDone ? "border-green-600 bg-green-600 text-white" : "border-neutral-300 bg-white"
                  }`}
                >
                  {task.isDone && <Check size={14} />}
                </button>
                <span
                  className={`text-sm break-words ${
                    task.isDone ? "line-through text-neutral-500" : "text-neutral-700"
                  }`}
                >
                  {task.text}
                </span>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="shrink-0 p-1 text-neutral-400 hover:text-red-600 rounded"
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
