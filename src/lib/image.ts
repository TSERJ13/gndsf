// Uploaded photos are re-encoded to a medium size before storage:
// long side ≤ 1000 px, WebP quality 78, EXIF rotation applied and
// metadata (GPS etc.) stripped. A 6 MB phone photo ends up ~100-200 KB.
import sharp from "sharp";

export const PHOTO_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;

export type PhotoPreset = "photo" | "logo";
const PRESETS: Record<PhotoPreset, { size: number; quality: number }> = {
  photo: { size: 1000, quality: 78 },
  logo: { size: 400, quality: 85 },
};

export async function toMediumWebp(file: File, preset: PhotoPreset = "photo"): Promise<Buffer | null> {
  if (!PHOTO_INPUT_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_INPUT_BYTES) return null;
  const { size, quality } = PRESETS[preset];
  try {
    return await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch (e) {
    console.error("image processing failed:", e);
    return null;
  }
}

// Resize + upload to Vercel Blob. Returns the public URL, or null when the
// file is not a usable image or storage is not configured.
export async function uploadPhoto(
  file: FormDataEntryValue | null,
  pathPrefix: string,
  preset: PhotoPreset = "photo",
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const webp = await toMediumWebp(file, preset);
  if (!webp) return null;
  const { put } = await import("@vercel/blob");
  const blob = await put(`${pathPrefix}.webp`, webp, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/webp",
  });
  return blob.url;
}
