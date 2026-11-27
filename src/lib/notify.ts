// Automatic e-mails sent from no-reply@gndsf.ge (via src/lib/mail.ts),
// in the site's branded layout (src/lib/emailTemplate.ts).
// Every function here is best-effort: a mail failure is logged and never
// blocks the action that triggered it (approval, registration…).
import { mailConfigured, sendMail } from "./mail";
import { siteUrl } from "./tokens";
import { renderEmailHtml, renderEmailText, type EmailContent } from "./emailTemplate";

async function send(to: string | string[] | null | undefined, subject: string, content: EmailContent) {
  const list = (Array.isArray(to) ? to : [to]).filter((x): x is string => !!x && x.includes("@"));
  if (!list.length || !mailConfigured()) return;
  try {
    await sendMail({ to: list, subject, text: renderEmailText(content), html: renderEmailHtml(content) });
  } catch (e) {
    console.error(`notify failed (${subject}):`, e);
  }
}

function federationInbox() {
  return process.env.FEDERATION_NOTIFY_EMAIL ?? "contact@gndsf.ge";
}

// ── Studios ──

export function clubApplicationReceived(to: string, clubName: string) {
  return send(to, "GNDSF — სტუდიის განაცხადი მიღებულია", {
    heading: "განაცხადი მიღებულია",
    paragraphs: [
      "გამარჯობა,",
      `სტუდია „${clubName}“-ის განაცხადი მიღებულია. ფედერაცია მას მალე განიხილავს და შედეგს ამ მისამართზე გაცნობებთ.`,
    ],
  });
}

export function clubApproved(to: string, clubName: string) {
  return send(to, "GNDSF — სტუდია დამტკიცდა", {
    heading: "სტუდია დამტკიცდა",
    paragraphs: [
      "გილოცავთ!",
      `სტუდია „${clubName}“ დამტკიცდა GNDSF-ის წევრად. შედით კლუბის პანელში იმ ელფოსტითა და პაროლით, რომელიც განაცხადში მიუთითეთ.`,
      "პანელიდან შეგიძლიათ ათლეტების დამატება და წყვილების შექმნა.",
    ],
    cta: { label: "კლუბის პანელში შესვლა", url: `${siteUrl()}/login` },
  });
}

// Federation registered the studio itself: the manager sets a password.
export function clubInvite(to: string, clubName: string, managerName: string, link: string) {
  return send(to, `GNDSF — სტუდია „${clubName}“: კლუბის პანელი`, {
    heading: "მოგესალმებით GNDSF-ის პლატფორმაზე",
    paragraphs: [
      `გამარჯობა, ${managerName}!`,
      `ფედერაციამ სტუდია „${clubName}“ დაარეგისტრირა gndsf.ge-ზე. დააყენეთ პაროლი და შედით კლუბის პანელში.`,
      "პანელიდან შეგიძლიათ: ათლეტების დამატება (ფედერაცია ამტკიცებს), წყვილების შექმნა, ფოტოების ატვირთვა და სტუდიის მონაცემების შეცვლა. პაროლის შეცვლა ნებისმიერ დროს შეგიძლიათ „პარამეტრებში“.",
    ],
    facts: [
      ["სტუდია", clubName],
      ["შესასვლელი ელფოსტა", to],
    ],
    cta: { label: "პაროლის დაყენება", url: link, note: "ბმული მოქმედებს 7 დღე და ერთხელ გამოიყენება." },
  });
}

export function clubRejected(to: string, clubName: string, reason: string | null) {
  return send(to, "GNDSF — სტუდიის განაცხადი არ დამტკიცდა", {
    heading: "განაცხადი არ დამტკიცდა",
    paragraphs: [
      "გამარჯობა,",
      `სამწუხაროდ, სტუდია „${clubName}“-ის განაცხადი არ დამტკიცდა.`,
    ],
    facts: reason ? [["მიზეზი", reason]] : undefined,
    cta: { label: "დაგვიკავშირდით", url: `${siteUrl()}/contact` },
  });
}

// ── Athletes ──

export function athleteApprovedToClub(to: string[], athleteName: string, gid: string) {
  return send(to, `GNDSF — ათლეტი დამტკიცდა: ${athleteName}`, {
    heading: "ათლეტი დამტკიცდა",
    paragraphs: [
      `ათლეტი ${athleteName} დამტკიცდა და E-CARD შეიქმნა.`,
      "ათლეტს (ან მშობელს) კაბინეტში შესასვლელი ბმული ცალკე წერილით გაეგზავნა.",
    ],
    facts: [
      ["ათლეტი", athleteName],
      ["GID", gid],
    ],
    cta: { label: "ათლეტების სია", url: `${siteUrl()}/portal/athletes` },
  });
}

export function athleteReturnedToClub(to: string[], athleteName: string, note: string) {
  return send(to, `GNDSF — ათლეტის განაცხადი დაბრუნდა: ${athleteName}`, {
    heading: "განაცხადი დაბრუნდა შესასწორებლად",
    paragraphs: [`ათლეტის „${athleteName}“ განაცხადი დაბრუნდა. შეასწორეთ მონაცემები კლუბის პანელში და ხელახლა გაგზავნეთ.`],
    facts: [["კომენტარი", note]],
    cta: { label: "შესწორება პანელში", url: `${siteUrl()}/portal/athletes` },
  });
}

export function athleteWelcome(to: string, athleteName: string, gid: string, link: string) {
  return send(to, "GNDSF — მოგესალმებით! თქვენი E-CARD მზადაა", {
    heading: "თქვენი E-CARD მზადაა",
    paragraphs: [
      "გამარჯობა,",
      `${athleteName} დარეგისტრირდა საქართველოს სპორტული ცეკვების ეროვნულ ფედერაციაში.`,
      "პირად კაბინეტში ნახავთ ბარათს QR-ით (Apple/Google Wallet-ში დასამატებლად), ქულებს და შედეგებს. შესასვლელად დააყენეთ პაროლი.",
    ],
    facts: [
      ["ათლეტი", athleteName],
      ["GID", gid],
    ],
    cta: { label: "პაროლის დაყენება", url: link, note: "ბმული მოქმედებს 7 დღე." },
  });
}

// ── Everyone ──

export function passwordReset(to: string, link: string) {
  return send(to, "GNDSF — პაროლის აღდგენა", {
    heading: "პაროლის აღდგენა",
    paragraphs: ["გამარჯობა,", "პაროლის აღსადგენად დააჭირეთ ღილაკს.", "თუ ეს თქვენ არ მოგითხოვიათ, უბრალოდ უგულებელყავით ეს წერილი."],
    cta: { label: "ახალი პაროლის დაყენება", url: link, note: "ბმული მოქმედებს 2 საათი." },
  });
}

// ── Federation ──

export function federationNewApplication(kind: "club" | "athlete", name: string, detail: string) {
  const path = kind === "club" ? "/portal/club-registrations" : "/portal/athletes?status=PENDING";
  return send(federationInbox(), kind === "club" ? `ახალი სტუდიის განაცხადი: ${name}` : `ახალი ათლეტი ელოდება დამტკიცებას: ${name}`, {
    heading: kind === "club" ? "ახალი სტუდიის განაცხადი" : "ახალი ათლეტი ელოდება დამტკიცებას",
    paragraphs: [detail],
    cta: { label: "განხილვა", url: `${siteUrl()}${path}` },
  });
}

// Shown by the settings page's "test mail" button.
export function testMailContent(sender: string): EmailContent {
  return {
    heading: "სატესტო წერილი",
    paragraphs: ["ეს სატესტო წერილია gndsf.ge-დან. თუ ამას კითხულობთ, ავტომატური ფოსტა მუშაობს."],
    facts: [["გამგზავნი", sender]],
    cta: { label: "gndsf.ge", url: siteUrl() },
  };
}
