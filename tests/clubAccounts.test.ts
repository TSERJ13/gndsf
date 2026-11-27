import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBulk } from "../src/lib/clubAccounts";
import { renderEmailHtml, renderEmailText } from "../src/lib/emailTemplate";

test("bulk list: semicolons, tabs, commas, blanks and bad lines", () => {
  const { rows, bad } = parseBulk(
    "ელეგანსი; თბილისი; Info@Elegance.ge; ნინო\n\nდანს არტი\tბათუმი\tda@x.ge\nცუდი; ქალაქი; არა-მეილი\nერთი, ქუთაისი, a@b.ge",
  );
  assert.deepEqual(rows.map((r) => [r.line, r.name, r.city, r.email, r.manager]), [
    [1, "ელეგანსი", "თბილისი", "info@elegance.ge", "ნინო"],
    [3, "დანს არტი", "ბათუმი", "da@x.ge", null],
    [5, "ერთი", "ქუთაისი", "a@b.ge", null],
  ]);
  assert.deepEqual(bad, [4]);
});

test("email template escapes input and carries the button link", () => {
  const c = { heading: "<b>x</b>", paragraphs: ["a & b"], cta: { label: "go", url: "https://gndsf.ge/set-password?token=a&b" } };
  const html = renderEmailHtml(c);
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(html.includes("a &amp; b"));
  assert.ok(html.includes('href="https://gndsf.ge/set-password?token=a&amp;b"'));
  assert.ok(renderEmailText(c).includes("https://gndsf.ge/set-password?token=a&b"));
});
