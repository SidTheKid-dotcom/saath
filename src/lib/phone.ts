/** Indian mobile numbers: 10 digits starting 6-9, with an optional +91 / 91 / 0 prefix. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** "+919876543210" -> "98765 43210" for display. */
export function formatPhone(e164: string): string {
  const d = e164.replace(/^\+91/, "");
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : e164;
}
