import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, categoryFor } from "@/lib/labels";

// Google Wallet "Save" link for the athlete's own card (generic pass).
// Requires (Vercel env): GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL,
// GOOGLE_WALLET_SA_KEY (service-account private key, PKCS8 PEM, \n-escaped).
export async function GET() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const saEmail = process.env.GOOGLE_WALLET_SA_EMAIL;
  const saKey = process.env.GOOGLE_WALLET_SA_KEY;
  if (!issuerId || !saEmail || !saKey) {
    return NextResponse.json(
      { error: "Google Wallet არ არის კონფიგურირებული (იხ. README)" },
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

  const objectId = `${issuerId}.gndsf-${a.gid.toLowerCase()}`;
  const genericObject = {
    id: objectId,
    classId: `${issuerId}.gndsf_license`,
    cardTitle: { defaultValue: { language: "ka", value: "GNDSF · სპორტსმენის ლიცენზია" } },
    header: { defaultValue: { language: "ka", value: `${a.firstName} ${a.lastName}` } },
    subheader: { defaultValue: { language: "ka", value: a.gid } },
    hexBackgroundColor: "#101014",
    logo: { sourceUri: { uri: "https://gndsf.ge/brand/logo-header%402x.png" } },
    ...(a.photoUrl?.startsWith("https://")
      ? { heroImage: { sourceUri: { uri: a.photoUrl } } }
      : {}),
    barcode: { type: "QR_CODE", value: `https://gndsf.ge/verify/${a.gid}`, alternateText: a.gid },
    textModulesData: [
      { id: "category", header: "კატეგორია", body: CATEGORY_LABELS[categoryFor(a.birthDate)] },
      { id: "club", header: "კლუბი", body: a.clubMemberships[0]?.club.name ?? "—" },
      { id: "season", header: "ლიცენზია", body: `${new Date().getFullYear()} სეზონი` },
    ],
  };

  const key = await importPKCS8(saKey.replace(/\\n/g, "\n"), "RS256");
  const jwt = await new SignJWT({
    iss: saEmail,
    aud: "google",
    typ: "savetowallet",
    payload: { genericObjects: [genericObject] },
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  return NextResponse.redirect(`https://pay.google.com/gp/v/save/${jwt}`);
}
