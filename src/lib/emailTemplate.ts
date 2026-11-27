// Branded HTML for every automatic e-mail, in the site's look: the GNDSF
// logo and name in the header, the federation's dark red, a single
// call-to-action button. Table layout + inline styles so it renders the
// same in Gmail, Outlook and phone mail apps.
import { siteUrl } from "./tokens";

export type EmailContent = {
  heading: string;
  // Paragraphs; a line break inside one stays a line break.
  paragraphs: string[];
  // Labelled facts shown in a small box (GID, club, reason…).
  facts?: [string, string][];
  cta?: { label: string; url: string; note?: string };
};

const RED = "#8B1E0F";
const ACCENT = "#B83A14";
const FONT = "'Noto Sans Georgian','Segoe UI',Arial,sans-serif";

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const para = (p: string) =>
  `<p style="margin:0 0 16px;font:15px/1.6 ${FONT};color:#333">${esc(p).replace(/\n/g, "<br>")}</p>`;

export function renderEmailHtml(c: EmailContent) {
  const site = siteUrl();
  const facts = c.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:#faf7f5;border-left:3px solid ${RED}">${c.facts
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 14px;font:13px/1.4 ${FONT};color:#777;white-space:nowrap;vertical-align:top;width:1%">${esc(k)}</td><td style="padding:8px 14px 8px 0;font:bold 14px/1.4 ${FONT};color:#111">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 12px"><tr><td style="background:${RED};border-radius:4px"><a href="${esc(c.cta.url)}" style="display:inline-block;padding:13px 28px;font:bold 14px/1 ${FONT};color:#fff;text-decoration:none;letter-spacing:.04em">${esc(c.cta.label)}</a></td></tr></table>` +
      `<p style="margin:0 0 16px;font:12px/1.5 ${FONT};color:#888">${c.cta.note ? esc(c.cta.note) + "<br>" : ""}ღილაკი თუ არ მუშაობს, გახსენით ბმული: <a href="${esc(c.cta.url)}" style="color:${ACCENT};word-break:break-all">${esc(c.cta.url)}</a></p>`
    : "";

  return `<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.heading)}</title></head>
<body style="margin:0;padding:0;background:#f2f0ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ee"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-top:4px solid ${RED}">
<tr><td style="padding:22px 28px;border-bottom:1px solid #eee">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle"><img src="${site}/brand/logo-header@2x.png" width="48" height="48" alt="GNDSF" style="display:block;border:0"></td>
    <td style="vertical-align:middle;padding-left:14px;font:bold 10px/1.35 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${RED}">საქართველოს<br><span style="font-size:15px;color:#111;letter-spacing:0">სპორტცეკვების</span><br>ეროვნული ფედერაცია</td>
  </tr></table>
</td></tr>
<tr><td style="padding:30px 28px 14px">
  <h1 style="margin:0 0 20px;font:300 22px/1.3 ${FONT};color:#111;letter-spacing:.02em">${esc(c.heading)}</h1>
  ${c.paragraphs.map(para).join("")}
  ${facts}
  ${cta}
</td></tr>
<tr><td style="padding:18px 28px 24px;background:#1a1a1a;font:12px/1.6 ${FONT};color:#aaa">
  საქართველოს სპორტული ცეკვების ეროვნული ფედერაცია · <a href="${site}" style="color:#fff;text-decoration:none">gndsf.ge</a><br>
  ეს წერილი ავტომატურია — მასზე პასუხი არ მიიღება. კითხვები: <a href="${site}/contact" style="color:#fff">${site.replace(/^https?:\/\//, "")}/contact</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

// Plain-text twin for mail apps that do not show HTML.
export function renderEmailText(c: EmailContent) {
  const parts = [c.heading, "", ...c.paragraphs.flatMap((p) => [p, ""])];
  if (c.facts?.length) parts.push(...c.facts.map(([k, v]) => `${k}: ${v}`), "");
  if (c.cta) parts.push(`${c.cta.label}:`, c.cta.url, ...(c.cta.note ? [c.cta.note] : []), "");
  parts.push("—", "საქართველოს სპორტული ცეკვების ეროვნული ფედერაცია", "gndsf.ge", "(ეს წერილი ავტომატურია, მასზე პასუხი არ მიიღება)");
  return parts.join("\n");
}
