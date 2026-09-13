import { Account, JournalEntry, JournalLine, NORMAL_BALANCE } from "@/lib/types";
import { round2 } from "@/lib/accounting/rules";

export class LedgerValidationError extends Error {}

/** Enforce that total debits equal total credits for a set of journal lines. */
export function validateBalanced(lines: JournalLine[]): { debit: number; credit: number } {
  const debit = round2(lines.reduce((s, l) => s + (l.debit || 0), 0));
  const credit = round2(lines.reduce((s, l) => s + (l.credit || 0), 0));
  if (debit <= 0 && credit <= 0) {
    throw new LedgerValidationError("Journal entry has no amount.");
  }
  if (Math.abs(debit - credit) > 0.005) {
    throw new LedgerValidationError(
      `Journal entry is not balanced: total debits (${debit.toFixed(2)}) must equal total credits (${credit.toFixed(2)}).`
    );
  }
  return { debit, credit };
}

export interface AccountLedgerRow {
  entryId: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

/** Signed movement of a journal line relative to an account's normal balance. */
function movement(account: Account, line: JournalLine): number {
  const normal = NORMAL_BALANCE[account.type];
  const net = line.debit - line.credit;
  return normal === "debit" ? net : -net;
}

/** Build the chronological ledger (T-account history) for a single account. */
export function getAccountLedger(account: Account, entries: JournalEntry[]): AccountLedgerRow[] {
  const relevant = entries
    .filter((e) => e.lines.some((l) => l.accountId === account.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let running = 0;
  const rows: AccountLedgerRow[] = [];
  for (const entry of relevant) {
    for (const l of entry.lines) {
      if (l.accountId !== account.id) continue;
      running = round2(running + movement(account, l));
      rows.push({
        entryId: entry.id,
        date: entry.date,
        reference: entry.reference,
        description: l.memo || entry.description,
        debit: l.debit,
        credit: l.credit,
        runningBalance: running,
      });
    }
  }
  return rows;
}

/** Compute the current balance of an account as of an optional cutoff date (inclusive). */
export function getAccountBalance(account: Account, entries: JournalEntry[], asOfDate?: string): number {
  let balance = 0;
  for (const entry of entries) {
    if (asOfDate && entry.date > asOfDate) continue;
    for (const l of entry.lines) {
      if (l.accountId !== account.id) continue;
      balance = round2(balance + movement(account, l));
    }
  }
  return balance;
}

export interface TrialBalanceRow {
  account: Account;
  debit: number;
  credit: number;
}

/** Trial balance: every account's balance expressed on its natural debit/credit side. */
export function computeTrialBalance(accounts: Account[], entries: JournalEntry[], asOfDate?: string): TrialBalanceRow[] {
  return accounts
    .filter((a) => !a.archived)
    .map((account) => {
      const balance = getAccountBalance(account, entries, asOfDate);
      const normal = NORMAL_BALANCE[account.type];
      const debit = normal === "debit" ? Math.max(balance, 0) : Math.max(-balance, 0);
      const credit = normal === "credit" ? Math.max(balance, 0) : Math.max(-balance, 0);
      return { account, debit: round2(debit), credit: round2(credit) };
    })
    .filter((row) => row.debit !== 0 || row.credit !== 0);
}

export function nextSequenceNumber(existing: { reference: string }[], prefix: string): string {
  const nums = existing
    .map((e) => e.reference)
    .filter((r) => r.startsWith(prefix + "-"))
    .map((r) => parseInt(r.split("-")[1], 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}
