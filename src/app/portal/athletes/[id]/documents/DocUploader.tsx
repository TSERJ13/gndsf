"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { registerAthleteDoc } from "./actions";

const MAX = 10 * 1024 * 1024;
const OK_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export default function DocUploader({ athleteId }: { athleteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "busy"; pct: number } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function onUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return setStatus({ kind: "error", msg: "აირჩიეთ ფაილი." });
    if (!OK_TYPES.has(file.type)) {
      return setStatus({ kind: "error", msg: "დაშვებულია: PDF, JPG, PNG, Word." });
    }
    if (file.size > MAX) return setStatus({ kind: "error", msg: "ფაილი 10 MB-ზე დიდია." });

    setStatus({ kind: "busy", pct: 0 });
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/athlete-docs/upload",
        clientPayload: athleteId,
        onUploadProgress: ({ percentage }) => setStatus({ kind: "busy", pct: Math.round(percentage) }),
      });
      await registerAthleteDoc({
        athleteId,
        name: file.name,
        size: file.size,
        contentType: file.type,
        url: blob.url,
      });
      window.location.href = `/portal/athletes/${athleteId}/documents?ok=uploaded`;
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message || "ატვირთვა ვერ მოხერხდა." });
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="font-semibold">დოკუმენტის ატვირთვა</h2>
      <p className="mt-1 text-xs text-neutral-500">
        სამედიცინო ცნობა, დაბადების მოწმობა, მშობლის თანხმობა… · PDF, JPG, PNG, Word · მაქს. 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="mt-4 w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5"
      />
      <button
        onClick={onUpload}
        disabled={status.kind === "busy"}
        className="mt-3 w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {status.kind === "busy" ? `იტვირთება… ${status.pct}%` : "ატვირთვა"}
      </button>
      {status.kind === "error" && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">{status.msg}</p>
      )}
    </div>
  );
}
