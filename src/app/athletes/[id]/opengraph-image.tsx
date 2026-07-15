import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, categoryFor } from "@/lib/labels";

export const alt = "GNDSF სპორტსმენის პროფილი";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [regular, bold, logo, athlete] = await Promise.all([
    readFile(path.join(process.cwd(), "src/assets/fonts/NotoSansGeorgian-Regular.ttf")),
    readFile(path.join(process.cwd(), "src/assets/fonts/NotoSansGeorgian-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/brand/logo.png")),
    db.athlete.findUnique({
      where: { id },
      include: {
        clubMemberships: { where: { endDate: null }, include: { club: true } },
        rankingPoints: { where: { validUntil: { gte: new Date() } } },
      },
    }),
  ]);

  const name = athlete ? `${athlete.firstName} ${athlete.lastName}` : "სპორტსმენი";
  const gid = athlete?.gid ?? "";
  const cat = athlete ? CATEGORY_LABELS[categoryFor(athlete.birthDate)] : "";
  const club = athlete?.clubMemberships[0]?.club.name ?? "";
  const points = athlete?.rankingPoints.reduce((s, p) => s + p.points, 0) ?? 0;
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf9f7",
          fontFamily: "Noto",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 18,
            height: "100%",
            background: "#8b1520",
            display: "flex",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={340}
          height={340}
          style={{ position: "absolute", right: 60, top: 145, opacity: 0.14 }}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 90px",
          }}
        >
          <div style={{ display: "flex", color: "#8b1520", fontSize: 30, letterSpacing: 6 }}>
            GNDSF · {gid}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              color: "#1a181c",
              marginTop: 18,
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#6d6a75", marginTop: 18 }}>
            {[cat, club].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 44 }}>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700, color: "#8b1520" }}>
              {points}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#6d6a75", marginLeft: 16 }}>
              მოქმედი ქულა · gndsf.ge
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto", data: regular, weight: 400 },
        { name: "Noto", data: bold, weight: 700 },
      ],
    },
  );
}
