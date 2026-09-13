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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01";
}

export function endOfMonth(iso: string): string {
  const d = new Date(iso.slice(0, 7) + "-01T00:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

export function startOfYear(iso: string): string {
  return iso.slice(0, 4) + "-01-01";
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
