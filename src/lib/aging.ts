import { Invoice } from "@/lib/types";

export interface AgingBuckets {
  current: number;
  d1to30: number;
  d31to60: number;
  d61plus: number;
  total: number;
}

/** Standard AR/AP aging buckets based on days past due. */
export function computeAging(invoices: Invoice[], asOfDate: string): AgingBuckets {
  const buckets: AgingBuckets = { current: 0, d1to30: 0, d31to60: 0, d61plus: 0, total: 0 };
  const asOf = new Date(asOfDate);

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "void") continue;
    const balance = Math.round((inv.total - inv.amountPaid + Number.EPSILON) * 100) / 100;
    if (balance <= 0) continue;
    const due = new Date(inv.dueDate);
    const daysPastDue = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPastDue <= 0) buckets.current += balance;
    else if (daysPastDue <= 30) buckets.d1to30 += balance;
    else if (daysPastDue <= 60) buckets.d31to60 += balance;
    else buckets.d61plus += balance;

    buckets.total += balance;
  }

  return buckets;
}
