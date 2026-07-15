import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, categoryFor } from "@/lib/labels";

// Apple Wallet .pkpass for the athlete's own card.
// Requires (Vercel env, base64-encoded PEMs): APPLE_PASS_SIGNER_CERT,
// APPLE_PASS_SIGNER_KEY, APPLE_PASS_KEY_PASSPHRASE (optional), APPLE_WWDR_CERT,
// APPLE_PASS_TYPE_ID (e.g. pass.ge.gndsf.license), APPLE_TEAM_ID.
export async function GET() {
  const signerCert = process.env.APPLE_PASS_SIGNER_CERT;
  const signerKey = process.env.APPLE_PASS_SIGNER_KEY;
  const wwdr = process.env.APPLE_WWDR_CERT;
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  if (!signerCert || !signerKey || !wwdr || !passTypeId || !teamId) {
    return NextResponse.json(
      { error: "Apple Wallet არ არის კონფიგურირებული (იხ. README)" },
      { status: 503 },
    );
  }

  const session = await auth();
  const athleteId = (session?.user as { athleteId?: string } | undefined)?.athleteId;
  if (!athleteId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const a = await db.athlete.findUniqueOrThrow({
    where: { id: athleteId },
    include: { clubMemberships: { where: { endDate: null }, include: { club: true } } },
  });

  const assets = path.join(process.cwd(), "src/assets/pass");
  const [icon, icon2x, logo, logo2x] = await Promise.all([
    readFile(path.join(assets, "icon.png")),
    readFile(path.join(assets, "icon@2x.png")),
    readFile(path.join(assets, "logo.png")),
    readFile(path.join(assets, "logo@2x.png")),
  ]);

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    organizationName: "GNDSF",
    serialNumber: a.gid,
    description: "GNDSF სპორტსმენის ლიცენზია",
    logoText: "GNDSF",
    backgroundColor: "rgb(16,16,20)",
    foregroundColor: "rgb(255,255,255)",
    labelColor: "rgb(196,30,44)",
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: `https://gndsf.ge/verify/${a.gid}`,
        messageEncoding: "iso-8859-1",
        altText: a.gid,
      },
    ],
    generic: {
      primaryFields: [
        { key: "name", label: "სახელი / NAME", value: `${a.firstName} ${a.lastName}` },
      ],
      secondaryFields: [
        { key: "gid", label: "GID", value: a.gid },
        {
          key: "category",
          label: "კატეგორია",
          value: CATEGORY_LABELS[categoryFor(a.birthDate)],
        },
      ],
      auxiliaryFields: [
        { key: "club", label: "კლუბი", value: a.clubMemberships[0]?.club.name ?? "—" },
        { key: "season", label: "ლიცენზია", value: `${new Date().getFullYear()} სეზონი` },
      ],
    },
  };

  const { PKPass } = await import("passkit-generator");
  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passJson)),
      "icon.png": icon,
      "icon@2x.png": icon2x,
      "logo.png": logo,
      "logo@2x.png": logo2x,
    },
    {
      wwdr: Buffer.from(wwdr, "base64"),
      signerCert: Buffer.from(signerCert, "base64"),
      signerKey: Buffer.from(signerKey, "base64"),
      signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE,
    },
  );

  return new NextResponse(new Uint8Array(pass.getAsBuffer()), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="gndsf-${a.gid}.pkpass"`,
    },
  });
}
