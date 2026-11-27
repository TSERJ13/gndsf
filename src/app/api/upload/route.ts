import { NextResponse } from "next/server";
import { putUpload, type UploadKind } from "@/lib/storage";

// Public endpoint (used by the e-card application wizard). Only accept the
// document/photo formats the form asks for: an open bucket must never serve
// HTML/SVG/JS uploaded by strangers.
const MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
const DOCUMENT_TYPES: Record<string, string> = { ...PHOTO_TYPES, "application/pdf": "pdf" };

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind: UploadKind = formData.get("kind") === "photo" ? "photo" : "document";

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const ext = (kind === "photo" ? PHOTO_TYPES : DOCUMENT_TYPES)[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Unguessable name; extension derived from the verified content type.
    const key = `${kind === "photo" ? "photos" : "documents"}/${crypto.randomUUID()}.${ext}`;
    const url = await putUpload(kind, key, Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
