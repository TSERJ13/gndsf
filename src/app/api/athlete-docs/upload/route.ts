import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — scans and certificates
const DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

// Direct client→Blob upload token endpoint for athlete documents.
// clientPayload carries the athleteId; club managers are scoped to
// athletes of their own club.
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "storage not configured" }, { status: 503 });
  }
  const session = await auth();
  const u = session?.user as { id?: string; role?: string; clubId?: string | null } | undefined;
  if (!u?.role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const athleteId = String(clientPayload ?? "");
        if (!athleteId) throw new Error("missing athlete");

        if (!REGISTRY.includes(u.role!)) {
          if (u.role !== "CLUB_MANAGER" || !u.clubId) throw new Error("forbidden");
          const inClub = await db.clubMembership.findFirst({
            where: { athleteId, clubId: u.clubId, endDate: null },
          });
          if (!inClub) throw new Error("forbidden: athlete not in your club");
        }
        return {
          allowedContentTypes: DOC_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
