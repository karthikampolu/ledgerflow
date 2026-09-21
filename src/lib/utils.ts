const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-GB",
  GBP: "en-GB",
};

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const locale = CURRENCY_LOCALE[currency] || "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

/** Just the currency's symbol (e.g. "$", "₹"), for compact chart axes and inline totals. */
export function currencySymbol(currency: string = "USD"): string {
  const locale = CURRENCY_LOCALE[currency] || "en-US";
  const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value || "$";
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Formats a Date as a local "YYYY-MM-DD" string using its local
 * year/month/day fields — never via toISOString(), which converts to UTC
 * and silently shifts the date backward in any timezone ahead of UTC
 * (e.g. IST, UTC+5:30) whenever local time is close to midnight.
 */
export function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toLocalIso(new Date());
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

export function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalIso(d);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01";
}

export function endOfMonth(iso: string): string {
  const d = new Date(iso.slice(0, 7) + "-01T00:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toLocalIso(d);
}

export function startOfYear(iso: string): string {
  return iso.slice(0, 4) + "-01-01";
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}