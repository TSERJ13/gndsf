"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewTopturnierImport,
  commitTopturnierImport,
  type TopturnierPreviewRow,
  type TopturnierEntryOption,
} from "./actions";

// Admin pastes the full TopTurnier results page (select-all + copy from
// the results website, e.g. dancesportinfo.lt) for one event. We parse
// the "Competition Listing" section client-side-triggered / server-parsed,
// let the admin confirm/fix the athlete match per row, then commit —
// reusing the exact same commitEventResults pipeline as manual entry, so
// scoring (getSoloScore/getCoupleScore) and ranking recompute happen
// identically either way.

type Row = TopturnierPreviewRow & { entryId: string; placementOverride: number; roundsOverride: number };

export function TopturnierImport({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [entryOptions, setEntryOptions] = useState<TopturnierEntryOption[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const input =
    "rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-900";

  async function handleParse() {
    setBusy(true);
    setErrorMsg(null);
    setDoneMsg(null);
    try {
      const res = await previewTopturnierImport(eventId, rawText);
      setEntryOptions(res.entryOptions);
      setWarnings(res.warnings);
      setRows(
        res.rows.map((r) => ({
          ...r,
          entryId: r.suggestedEntryId ?? "",
          placementOverride: r.placement,
          roundsOverride: r.roundsReached,
        })),
      );
      if (!res.rows.length) setErrorMsg("ვერაფერი დაიპარსა — გადაამოწმეთ ჩასმული ტექსტი.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "დაპარსვა ვერ მოხერხდა.");
    } finally {
      setBusy(false);
    }
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => (prev ? prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : prev));
  }

  async function handleCommit() {
    if (!rows) return;
    const missing = rows.filter((r) => !r.entryId);
    if (missing.length) {
      setErrorMsg(`${missing.length} მწკრივს არ აქვს მონაწილე მითითებული — აირჩიეთ ყველასთვის, ან წაშალეთ ის მწკრივი.`);
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await commitTopturnierImport(
        eventId,
        rows.map((r) => ({
          entryId: r.entryId,
          placement: r.placementOverride,
          roundsReached: r.roundsOverride,
        })),
      );
      setDoneMsg(`${res.count} შედეგი დაფიქსირდა და რეიტინგი გადაითვალა.`);
      setRows(null);
      setRawText("");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "დაფიქსირება ვერ მოხერხდა.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
      >
        TopTurnier-დან შემოტანა
      </button>
    );
  }

  return (
    <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">შედეგების შემოტანა TopTurnier-ის ექსპორტიდან</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setRows(null);
            setErrorMsg(null);
          }}
          className="text-xs text-neutral-500 hover:underline"
        >
          დახურვა
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        გახსენით ივენთის შედეგების გვერდი (მაგ. dancesportinfo.lt-ზე), მონიშნეთ მთელი გვერდი (Cmd/Ctrl+A),
        დააკოპირეთ (Cmd/Ctrl+C) და ჩასვით აქ. საკმარისია, რომ ტექსტში იყოს "Competition Listing" ან
        "Result of the Final" სექცია.
      </p>

      {!rows && (
        <div className="mt-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder="ჩასვით აქ TopTurnier-ის შედეგების გვერდის ტექსტი..."
            className={`${input} w-full font-mono text-xs`}
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={busy || !rawText.trim()}
              onClick={handleParse}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {busy ? "მუშავდება..." : "დაპარსვა და გადახედვა"}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMsg}</p>
      )}
      {doneMsg && (
        <p className="mt-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{doneMsg}</p>
      )}

      {rows && (
        <div className="mt-3">
          {warnings.length > 0 && (
            <ul className="mb-3 space-y-1 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
          <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">TopTurnier-ის სახელი</th>
                  <th className="px-3 py-2">მონაწილე (ჩვენს ბაზაში)</th>
                  <th className="w-24 px-3 py-2 text-right">ადგილი</th>
                  <th className="w-24 px-3 py-2 text-right">ტური</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r, i) => (
                  <tr key={i} className={r.entryId ? "" : "bg-red-50"}>
                    <td className="px-3 py-2 tabular-nums text-neutral-500">{r.startNumber}</td>
                    <td className="px-3 py-2">
                      {r.name}
                      <span className="text-neutral-400"> · {r.country}</span>
                      {r.placementTie && (
                        <span className="ml-1 text-amber-600">
                          (ტოლი: {r.placementTie[0]}-{r.placementTie[1]})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.entryId}
                        onChange={(e) => updateRow(i, { entryId: e.target.value })}
                        className={`${input} w-full`}
                      >
                        <option value="">— აირჩიეთ —</option>
                        {entryOptions.map((o) => (
                          <option key={o.entryId} value={o.entryId}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {!r.entryId && r.suggestedLabel && (
                        <span className="text-xs text-neutral-400">
                          ვერ მოიძებნა დამთხვევა "{r.suggestedLabel}"-სთან
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={r.placementOverride}
                        onChange={(e) => updateRow(i, { placementOverride: Number(e.target.value) })}
                        className={`${input} w-16 text-right tabular-nums`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={r.roundsOverride}
                        onChange={(e) => updateRow(i, { roundsOverride: Number(e.target.value) })}
                        className={`${input} w-16 text-right tabular-nums`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={handleCommit}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {busy ? "ფიქსირდება..." : `${rows.length} შედეგის დაფიქსირება`}
            </button>
            <button
              type="button"
              onClick={() => setRows(null)}
              className="text-sm text-neutral-500 hover:underline"
            >
              თავიდან დაპარსვა
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
