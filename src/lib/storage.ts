import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 storage for the public e-card application.
//
// Two kinds of uploads:
//  - "photo":    profile pictures. They end up on public athlete pages, so
//                they go to the public bucket (R2_BUCKET_NAME, served via
//                R2_PUBLIC_URL) and are stored as a full https URL.
//  - "document": ID cards (often of minors), parents' IDs, signed
//                agreements. These go to a PRIVATE bucket
//                (R2_PRIVATE_BUCKET_NAME, no public access) and are stored
//                as an opaque reference "r2-private:<key>". Staff view them
//                through short-lived presigned URLs only.

export type UploadKind = "photo" | "document";

export const PRIVATE_REF_PREFIX = "r2-private:";
const SIGNED_URL_TTL_SECONDS = 10 * 60;

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

function publicBase() {
  return (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
}

// Until a dedicated private bucket is configured, documents fall back to a
// "private/" prefix in the main bucket under an unguessable name. That is
// weaker (the bucket is public), so it is logged loudly.
function privateTarget(key: string) {
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  if (bucket) return { bucket, key };
  console.warn("R2_PRIVATE_BUCKET_NAME is not set: storing document in the PUBLIC bucket");
  return { bucket: process.env.R2_BUCKET_NAME!, key: `private/${key}` };
}

export async function putUpload(kind: UploadKind, key: string, body: Buffer, contentType: string) {
  if (kind === "photo") {
    await s3().send(
      new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key, Body: body, ContentType: contentType }),
    );
    return `${publicBase()}/${key}`;
  }
  const t = privateTarget(key);
  await s3().send(
    new PutObjectCommand({
      Bucket: t.bucket,
      Key: t.key,
      Body: body,
      ContentType: contentType,
      ContentDisposition: "inline",
    }),
  );
  return `${PRIVATE_REF_PREFIX}${t.bucket}/${t.key}`;
}

// ── validation of values coming back from the (untrusted) browser ──

const SAFE_KEY = /^[A-Za-z0-9/_.-]+$/;

export function isOwnPublicPhotoUrl(value: string) {
  const base = publicBase();
  if (!base || !value.startsWith(`${base}/`)) return false;
  return SAFE_KEY.test(value.slice(base.length + 1));
}

export function isPrivateRef(value: string) {
  if (!value.startsWith(PRIVATE_REF_PREFIX)) return false;
  const rest = value.slice(PRIVATE_REF_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return false;
  const bucket = rest.slice(0, slash);
  const allowed = [process.env.R2_PRIVATE_BUCKET_NAME, process.env.R2_BUCKET_NAME].filter(Boolean);
  return allowed.includes(bucket) && SAFE_KEY.test(rest.slice(slash + 1));
}

// ── staff-side resolution ──

export type ResolvedDoc = { url: string; isPdf: boolean } | null;

// Turns a stored value into something a staff page can link to.
// - private refs → presigned GET URL (expires in 10 minutes)
// - legacy public URLs from our own bucket → as is
// - anything else (e.g. "javascript:…" injected via the public form) → null
export async function resolveStoredFile(value: string | null | undefined): Promise<ResolvedDoc> {
  if (!value) return null;
  if (isPrivateRef(value)) {
    const rest = value.slice(PRIVATE_REF_PREFIX.length);
    const slash = rest.indexOf("/");
    const key = rest.slice(slash + 1);
    const url = await getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: rest.slice(0, slash), Key: key }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    );
    return { url, isPdf: key.toLowerCase().endsWith(".pdf") };
  }
  if (isOwnPublicPhotoUrl(value) || /^https:\/\/[^\s"'<>]+$/.test(value)) {
    return { url: value, isPdf: value.toLowerCase().split("?")[0].endsWith(".pdf") };
  }
  return null;
}
