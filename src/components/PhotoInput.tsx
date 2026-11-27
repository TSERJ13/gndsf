"use client";

// File input that shrinks the chosen photo in the browser (long side
// ≤ 1600 px, JPEG 85%) before the form is submitted, so phone photos stay
// well under the server upload limit. The server re-encodes it again to
// the final medium size (src/lib/image.ts).
import { useRef, useState } from "react";

const MAX = 1600;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // e.g. HEIC the browser can't decode: the server handles it
  }
}

export default function PhotoInput({
  name = "photo",
  id,
  className = "mt-1 w-full text-sm",
}: {
  name?: string;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <input
        ref={ref}
        id={id}
        name={name}
        type="file"
        accept="image/*"
        className={className}
        onChange={async (e) => {
          const original = e.target.files?.[0];
          if (!original) return setPreview(null);
          const small = await shrink(original);
          const dt = new DataTransfer();
          dt.items.add(small);
          if (ref.current) ref.current.files = dt.files;
          setPreview(URL.createObjectURL(small));
        }}
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mt-2 h-24 w-24 rounded object-cover" />
      )}
    </div>
  );
}
