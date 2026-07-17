// ── AI birth-date extraction from athlete documents ──
// Sends the uploaded scan (JPG/PNG image block or PDF document block)
// to the Claude API and asks for the date of birth as strict JSON.
// Docs: https://platform.claude.com/docs/en/build-with-claude/vision

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
const IMAGE_MAX = 5 * 1024 * 1024; // API limit per image

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export type Extraction =
  | { ok: true; birthDate: string } // YYYY-MM-DD
  | { ok: false; reason: "notfound" | "toolarge" | "unsupported" | "error" };

export async function extractBirthDate(
  url: string,
  contentType: string,
): Promise<Extraction> {
  const isImage = contentType === "image/jpeg" || contentType === "image/png";
  const isPdf = contentType === "application/pdf";
  if (!isImage && !isPdf) return { ok: false, reason: "unsupported" };

  try {
    const fileRes = await fetch(url);
    if (!fileRes.ok) return { ok: false, reason: "error" };
    const buf = Buffer.from(await fileRes.arrayBuffer());
    if (isImage && buf.length > IMAGE_MAX) return { ok: false, reason: "toolarge" };

    const fileBlock = isImage
      ? {
          type: "image",
          source: { type: "base64", media_type: contentType, data: buf.toString("base64") },
        }
      : {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") },
        };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              fileBlock,
              {
                type: "text",
                text:
                  "This is a Georgian identity document, birth certificate, or medical certificate. " +
                  "Find the person's DATE OF BIRTH (დაბადების თარიღი). Georgian documents usually " +
                  "print dates as DD.MM.YYYY. Respond with ONLY this JSON, no other text: " +
                  '{"found": true, "birthDate": "YYYY-MM-DD"} or {"found": false}',
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("docai api error:", res.status, await res.text().catch(() => ""));
      return { ok: false, reason: "error" };
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const parsed = parseModelJson(text);
    if (parsed?.found && parsed.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.birthDate)) {
      return { ok: true, birthDate: parsed.birthDate };
    }
    return { ok: false, reason: "notfound" };
  } catch (e) {
    console.error("docai failed:", e);
    return { ok: false, reason: "error" };
  }
}

export function parseModelJson(
  text: string,
): { found: boolean; birthDate?: string } | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Pure decision: compare extraction result against the registered birth date.
export function decideVerification(
  extraction: Extraction,
  registeredBirthDate: Date,
): { status: "MATCH" | "MISMATCH" | "UNREADABLE"; extracted: Date | null; note: string } {
  if (!extraction.ok) {
    const notes: Record<string, string> = {
      notfound: "დოკუმენტში დაბადების თარიღი ვერ მოიძებნა.",
      toolarge: "სურათი ძალიან დიდია AI-წაკითხვისთვის (მაქს. 5 MB) — სცადეთ PDF ან შემცირებული ფოტო.",
      unsupported: "AI-წაკითხვა მუშაობს PDF/JPG/PNG ფაილებზე.",
      error: "წაკითხვა ვერ შესრულდა — სცადეთ ხელახლა.",
    };
    return { status: "UNREADABLE", extracted: null, note: notes[extraction.reason] };
  }
  const extracted = new Date(`${extraction.birthDate}T00:00:00Z`);
  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
  const same =
    extracted.getUTCFullYear() === registeredBirthDate.getUTCFullYear() &&
    extracted.getUTCMonth() === registeredBirthDate.getUTCMonth() &&
    extracted.getUTCDate() === registeredBirthDate.getUTCDate();
  if (same) {
    return {
      status: "MATCH",
      extracted,
      note: `დოკუმენტის თარიღი ემთხვევა ბაზას: ${fmt(extracted)}`,
    };
  }
  return {
    status: "MISMATCH",
    extracted,
    note: `დოკუმენტში: ${fmt(extracted)} · ბაზაში: ${fmt(registeredBirthDate)}`,
  };
}
