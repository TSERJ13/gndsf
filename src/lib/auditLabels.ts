// Plain Georgian names for audit-log action codes (dashboard, workspace).
export const AUDIT_LABELS: Record<string, string> = {
  ATHLETE_APPROVE: "ათლეტი დამტკიცდა",
  ATHLETE_CREATE: "ათლეტი დაემატა",
  ATHLETE_RESUBMIT: "ათლეტი ხელახლა გაიგზავნა",
  ATHLETE_RETURN: "ათლეტი დაბრუნდა",
  ATHLETE_INVITE: "კაბინეტის ბმული გაიგზავნა",
  ATHLETE_TRANSFER: "ათლეტის ტრანსფერი",
  ATHLETE_PHOTO_UPLOAD: "ათლეტის ფოტო",
  ATHLETE_DOC_UPLOAD: "დოკუმენტი აიტვირთა",
  ATHLETE_DOC_DELETE: "დოკუმენტი წაიშალა",
  ATHLETE_DOC_MISMATCH: "დოკუმენტი არ ემთხვევა",
  ATHLETE_EDIT_APPROVED: "მონაცემების შეცვლა დამტკიცდა",
  ATHLETE_EDIT_REJECTED: "მონაცემების შეცვლა უარყოფილია",
  CLUB_CREATE: "სტუდია დაემატა",
  CLUB_UPDATE: "სტუდია განახლდა",
  CLUB_SELF_UPDATE: "სტუდიამ მონაცემები შეცვალა",
  CLUB_MANAGER_INVITE: "სტუდიას მოსაწვევი გაეგზავნა",
  CLUB_SIGNUP_APPROVE: "სტუდიის განაცხადი დამტკიცდა",
  CLUB_SIGNUP_REJECT: "სტუდიის განაცხადი უარყოფილია",
  CLUB_ACTIVATE: "სტუდია ჩაირთო",
  CLUB_DEACTIVATE: "სტუდია გაითიშა",
  COMPETITION_CREATE: "შეჯიბრება შეიქმნა",
  COMPETITION_PUBLISH: "შეჯიბრება გამოქვეყნდა",
  RESULT_COMMIT: "შედეგები შევიდა",
  RESULT_IMPORT_TOPTURNIER: "შედეგები TopTurnier-დან",
  RESCORE_ALL: "ქულები გადაითვალა",
  PARTNERSHIP_FORM: "წყვილი შეიქმნა",
  PARTNERSHIP_SPLIT: "წყვილი დაიშალა",
  TRANSFER_APPROVE: "ტრანსფერი დამტკიცდა",
  TRANSITIONS_NOTIFY: "კატეგორიის ცვლილების შეტყობინება",
  NEWS_CREATE: "სიახლე დაემატა",
  NEWS_UPDATE: "სიახლე განახლდა",
  NEWS_DELETE: "სიახლე წაიშალა",
  CALENDAR_CREATE: "კალენდარში დაემატა",
  CALENDAR_DELETE: "კალენდრიდან წაიშალა",
  DOCUMENT_UPLOAD: "დოკუმენტი გამოქვეყნდა",
  DOCUMENT_DELETE: "დოკუმენტი წაიშალა",
  MAILBOX_CONNECT: "ფოსტა დაუკავშირდა",
  MAILBOX_DISCONNECT: "ფოსტა გაითიშა",
  MAIL_SEND: "წერილი გაიგზავნა",
  MAIL_DELETE: "წერილი წაიშალა",
  USER_CREATE: "მომხმარებელი დაემატა",
  USER_PASSWORD_RESET: "მომხმარებლის პაროლი შეიცვალა",
  PASSWORD_CHANGE: "პაროლი შეიცვალა",
  PASSWORD_RESET: "პაროლი აღდგა",
  INVITE_ACCEPTED: "ანგარიში გააქტიურდა",
};

export const auditLabel = (code: string) => AUDIT_LABELS[code] ?? code;

export function timeAgo(d: Date, now = new Date()) {
  const m = Math.round((+now - +d) / 60000);
  if (m < 1) return "ახლახან";
  if (m < 60) return `${m} წთ წინ`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} სთ წინ`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} დღის წინ`;
  return d.toLocaleDateString("ka-GE");
}
