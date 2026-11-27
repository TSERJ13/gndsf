// Automatic e-mails sent from no-reply@gndsf.ge (via src/lib/mail.ts).
// Every function here is best-effort: a mail failure is logged and never
// blocks the action that triggered it (approval, registration…).
import { mailConfigured, sendMail } from "./mail";
import { siteUrl } from "./tokens";

const SIGNATURE = "\n\n—\nსაქართველოს სპორტული ცეკვების ეროვნული ფედერაცია\ngndsf.ge\n(ეს წერილი ავტომატურია, მასზე პასუხი არ მიიღება)";

async function send(to: string | string[] | null | undefined, subject: string, body: string) {
  const list = (Array.isArray(to) ? to : [to]).filter((x): x is string => !!x && x.includes("@"));
  if (!list.length || !mailConfigured()) return;
  try {
    await sendMail({ to: list, subject, text: body + SIGNATURE });
  } catch (e) {
    console.error(`notify failed (${subject}):`, e);
  }
}

function federationInbox() {
  return process.env.FEDERATION_NOTIFY_EMAIL ?? "contact@gndsf.ge";
}

// ── Studios ──

export function clubApplicationReceived(to: string, clubName: string) {
  return send(
    to,
    "GNDSF — სტუდიის განაცხადი მიღებულია",
    `გამარჯობა,\n\nსტუდია „${clubName}“-ის განაცხადი მიღებულია. ფედერაცია მას მალე განიხილავს და შედეგს ამ მისამართზე გაცნობებთ.`,
  );
}

export function clubApproved(to: string, clubName: string) {
  return send(
    to,
    "GNDSF — სტუდია დამტკიცდა",
    `გილოცავთ!\n\nსტუდია „${clubName}“ დამტკიცდა GNDSF-ის წევრად.\n\nშედით კლუბის პანელში იმ ელფოსტითა და პაროლით, რომელიც განაცხადში მიუთითეთ:\n${siteUrl()}/login\n\nპანელიდან შეგიძლიათ ათლეტების დამატება და წყვილების შექმნა.`,
  );
}

export function clubRejected(to: string, clubName: string, reason: string | null) {
  return send(
    to,
    "GNDSF — სტუდიის განაცხადი არ დამტკიცდა",
    `გამარჯობა,\n\nსამწუხაროდ, სტუდია „${clubName}“-ის განაცხადი არ დამტკიცდა.` +
      (reason ? `\n\nმიზეზი: ${reason}` : "") +
      `\n\nკითხვების შემთხვევაში დაგვიკავშირდით: ${siteUrl()}/contact`,
  );
}

// ── Athletes ──

export function athleteApprovedToClub(to: string[], athleteName: string, gid: string) {
  return send(
    to,
    `GNDSF — ათლეტი დამტკიცდა: ${athleteName}`,
    `ათლეტი ${athleteName} დამტკიცდა.\nGID: ${gid}\n\nE-CARD შეიქმნა. ათლეტს (ან მშობელს) კაბინეტში შესასვლელი ბმული ცალკე წერილით გაეგზავნა.`,
  );
}

export function athleteReturnedToClub(to: string[], athleteName: string, note: string) {
  return send(
    to,
    `GNDSF — ათლეტის განაცხადი დაბრუნდა: ${athleteName}`,
    `ათლეტის „${athleteName}“ განაცხადი შესასწორებლად დაბრუნდა.\n\nკომენტარი: ${note}\n\nშეასწორეთ მონაცემები კლუბის პანელში და ხელახლა გაგზავნეთ:\n${siteUrl()}/portal/athletes`,
  );
}

export function athleteWelcome(to: string, athleteName: string, gid: string, link: string) {
  return send(
    to,
    "GNDSF — მოგესალმებით! თქვენი E-CARD მზადაა",
    `გამარჯობა,\n\n${athleteName} დარეგისტრირდა საქართველოს სპორტული ცეკვების ეროვნულ ფედერაციაში.\nGID: ${gid}\n\nE-CARD მზადაა. პირად კაბინეტში შესასვლელად დააყენეთ პაროლი (ბმული მოქმედებს 7 დღე):\n${link}\n\nკაბინეტში ნახავთ ბარათს QR-ით (Apple/Google Wallet-ში დასამატებლად), ქულებს და შედეგებს.`,
  );
}

// ── Everyone ──

export function passwordReset(to: string, link: string) {
  return send(
    to,
    "GNDSF — პაროლის აღდგენა",
    `გამარჯობა,\n\nპაროლის აღსადგენად გადადით ბმულზე (მოქმედებს 2 საათი):\n${link}\n\nთუ ეს თქვენ არ მოგითხოვიათ, უბრალოდ უგულებელყავით ეს წერილი.`,
  );
}

// ── Federation ──

export function federationNewApplication(kind: "club" | "athlete", name: string, detail: string) {
  const path = kind === "club" ? "/portal/club-registrations" : "/portal/athletes?status=PENDING";
  return send(
    federationInbox(),
    kind === "club" ? `ახალი სტუდიის განაცხადი: ${name}` : `ახალი ათლეტი ელოდება დამტკიცებას: ${name}`,
    `${detail}\n\nგანხილვა: ${siteUrl()}${path}`,
  );
}
