import { BankTransaction, Transaction } from "@/lib/types";

export interface MatchSuggestion {
  bankTransactionId: string;
  transactionId: string;
  confidence: number; // 0-1
  reason: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysApart(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / MS_PER_DAY;
}

/** Signed cash-flow amount for a recorded transaction, for comparison against a bank line. */
function transactionCashAmount(tx: Transaction): number {
  const outflow = tx.type === "purchase" || tx.type === "expense" || tx.type === "payment";
  const sign = outflow ? -1 : 1;
  return sign * tx.totalAmount;
}

/**
 * Deterministic amount + date proximity matcher (no AI/ML): for each
 * unmatched bank line, suggest the closest unreconciled recorded
 * transaction with the same signed amount within a reasonable date window.
 */
export function suggestMatches(bankTransactions: BankTransaction[], transactions: Transaction[], usedTransactionIds: Set<string> = new Set()): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = [];
  const claimed = new Set(usedTransactionIds);

  const unmatchedBank = bankTransactions.filter((b) => b.status === "unmatched");
  const candidateTx = transactions.filter((t) => !claimed.has(t.id));

  for (const bank of unmatchedBank) {
    let best: { tx: Transaction; score: number; reason: string } | null = null;
    for (const tx of candidateTx) {
      if (claimed.has(tx.id)) continue;
      const cashAmount = transactionCashAmount(tx);
      const amountMatches = Math.abs(cashAmount - bank.amount) < 0.01;
      if (!amountMatches) continue;
      const gap = daysApart(bank.date, tx.date);
      if (gap > 14) continue;
      const score = Math.max(0, 1 - gap / 14);
      if (!best || score > best.score) {
        best = { tx, score, reason: gap === 0 ? "Exact amount and date match" : `Exact amount, ${Math.round(gap)}d apart` };
      }
    }
    if (best) {
      suggestions.push({
        bankTransactionId: bank.id,
        transactionId: best.tx.id,
        confidence: round2(0.5 + best.score * 0.5),
        reason: best.reason,
      });
      claimed.add(best.tx.id);
    }
  }

  return suggestions;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
