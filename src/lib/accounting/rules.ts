import { Account, JournalLine, TransactionInput } from "@/lib/types";

/** Standard account codes referenced by the rules engine. */
export const CODE = {
  CASH: "1000",
  BANK: "1010",
  AR: "1200",
  INVENTORY: "1400",
  AP: "2000",
  SALES_TAX_PAYABLE: "2100",
  SALES_REVENUE: "4000",
  DEFAULT_EXPENSE: "6900",
};

export class RuleEngineError extends Error {}

function byCode(accounts: Account[], code: string): Account {
  const acc = accounts.find((a) => a.code === code);
  if (!acc) throw new RuleEngineError(`Chart of Accounts is missing required account ${code}`);
  return acc;
}

function byId(accounts: Account[], id: string): Account {
  const acc = accounts.find((a) => a.id === id);
  if (!acc) throw new RuleEngineError(`Account ${id} not found`);
  return acc;
}

function line(account: Account, debit: number, credit: number, memo?: string): JournalLine {
  return {
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    debit: round2(debit),
    credit: round2(credit),
    memo,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Resolve the cash/bank settlement account for a payment method. */
function settlementAccount(accounts: Account[], method: "cash" | "bank"): Account {
  return byCode(accounts, method === "cash" ? CODE.CASH : CODE.BANK);
}

/**
 * Core automation: given a structured transaction input and the business's
 * Chart of Accounts, deterministically generate a balanced set of
 * double-entry journal lines. No AI/ML/OCR is involved — this is a pure
 * rules-based mapping from transaction type -> debit/credit accounts.
 */
export function generateJournalLines(input: TransactionInput, accounts: Account[]): JournalLine[] {
  const amount = round2(input.amount);
  const taxAmount = round2((amount * (input.taxRate || 0)) / 100);
  const total = round2(amount + taxAmount);

  switch (input.type) {
    case "sale": {
      const revenue = byCode(accounts, CODE.SALES_REVENUE);
      const lines: JournalLine[] = [];
      if (input.paymentMethod === "credit") {
        const ar = byCode(accounts, CODE.AR);
        lines.push(line(ar, total, 0, `Sale on credit to ${input.partyName}`));
      } else {
        const settle = settlementAccount(accounts, input.paymentMethod);
        lines.push(line(settle, total, 0, `Cash sale to ${input.partyName}`));
      }
      lines.push(line(revenue, 0, amount, `Revenue from sale to ${input.partyName}`));
      if (taxAmount > 0) {
        const taxPayable = byCode(accounts, CODE.SALES_TAX_PAYABLE);
        lines.push(line(taxPayable, 0, taxAmount, "Sales tax collected"));
      }
      return lines;
    }

    case "purchase": {
      const inventory = input.accountId ? byId(accounts, input.accountId) : byCode(accounts, CODE.INVENTORY);
      const lines: JournalLine[] = [];
      lines.push(line(inventory, total, 0, `Purchase from ${input.partyName}`));
      if (input.paymentMethod === "credit") {
        const ap = byCode(accounts, CODE.AP);
        lines.push(line(ap, 0, total, `Purchase on credit from ${input.partyName}`));
      } else {
        const settle = settlementAccount(accounts, input.paymentMethod);
        lines.push(line(settle, 0, total, `Cash purchase from ${input.partyName}`));
      }
      return lines;
    }

    case "expense": {
      const expenseAccount = input.accountId ? byId(accounts, input.accountId) : byCode(accounts, CODE.DEFAULT_EXPENSE);
      const lines: JournalLine[] = [];
      lines.push(line(expenseAccount, total, 0, input.memo || `${expenseAccount.name} - ${input.partyName}`));
      if (input.paymentMethod === "credit") {
        const ap = byCode(accounts, CODE.AP);
        lines.push(line(ap, 0, total, `Expense owed to ${input.partyName}`));
      } else {
        const settle = settlementAccount(accounts, input.paymentMethod);
        lines.push(line(settle, 0, total, `Paid ${input.partyName}`));
      }
      return lines;
    }

    case "receipt": {
      // Customer payment received against Accounts Receivable / an invoice.
      const settle = settlementAccount(accounts, input.paymentMethod === "credit" ? "bank" : input.paymentMethod);
      const ar = byCode(accounts, CODE.AR);
      return [
        line(settle, total, 0, `Payment received from ${input.partyName}`),
        line(ar, 0, total, `Applied to receivable from ${input.partyName}`),
      ];
    }

    case "payment": {
      // Payment made to a vendor against Accounts Payable / a bill.
      const settle = settlementAccount(accounts, input.paymentMethod === "credit" ? "bank" : input.paymentMethod);
      const ap = byCode(accounts, CODE.AP);
      return [
        line(ap, total, 0, `Applied to payable owed to ${input.partyName}`),
        line(settle, 0, total, `Payment made to ${input.partyName}`),
      ];
    }

    default:
      throw new RuleEngineError(`Unsupported transaction type: ${input.type}`);
  }
}

export function computeTaxAmount(amount: number, taxRate: number): number {
  return round2((amount * (taxRate || 0)) / 100);
}
