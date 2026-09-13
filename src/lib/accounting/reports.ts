import { Account, JournalEntry } from "@/lib/types";
import { getAccountBalance } from "@/lib/accounting/ledger";
import { round2 } from "@/lib/accounting/rules";

export interface ReportLine {
  account: Account;
  amount: number;
}

export interface ProfitAndLoss {
  periodStart: string;
  periodEnd: string;
  revenue: ReportLine[];
  totalRevenue: number;
  cogs: ReportLine[];
  totalCogs: number;
  grossProfit: number;
  operatingExpenses: ReportLine[];
  totalOperatingExpenses: number;
  taxExpense: ReportLine[];
  totalTaxExpense: number;
  netIncome: number;
}

function balanceInPeriod(account: Account, entries: JournalEntry[], start: string, end: string): number {
  const before = getAccountBalance(account, entries, dayBefore(start));
  const through = getAccountBalance(account, entries, end);
  return round2(through - before);
}

function dayBefore(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Automatic Profit & Loss (Income Statement) for a date range. */
export function computeProfitAndLoss(accounts: Account[], entries: JournalEntry[], periodStart: string, periodEnd: string): ProfitAndLoss {
  const active = accounts.filter((a) => !a.archived);

  const revenue = active
    .filter((a) => a.type === "revenue")
    .map((account) => ({ account, amount: balanceInPeriod(account, entries, periodStart, periodEnd) }))
    .filter((r) => r.amount !== 0);
  const totalRevenue = round2(revenue.reduce((s, r) => s + r.amount, 0));

  const cogs = active
    .filter((a) => a.subtype === "cogs")
    .map((account) => ({ account, amount: balanceInPeriod(account, entries, periodStart, periodEnd) }))
    .filter((r) => r.amount !== 0);
  const totalCogs = round2(cogs.reduce((s, r) => s + r.amount, 0));

  const grossProfit = round2(totalRevenue - totalCogs);

  const operatingExpenses = active
    .filter((a) => a.subtype === "operating_expense")
    .map((account) => ({ account, amount: balanceInPeriod(account, entries, periodStart, periodEnd) }))
    .filter((r) => r.amount !== 0);
  const totalOperatingExpenses = round2(operatingExpenses.reduce((s, r) => s + r.amount, 0));

  const taxExpense = active
    .filter((a) => a.subtype === "tax_expense")
    .map((account) => ({ account, amount: balanceInPeriod(account, entries, periodStart, periodEnd) }))
    .filter((r) => r.amount !== 0);
  const totalTaxExpense = round2(taxExpense.reduce((s, r) => s + r.amount, 0));

  const netIncome = round2(grossProfit - totalOperatingExpenses - totalTaxExpense);

  return {
    periodStart,
    periodEnd,
    revenue,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    operatingExpenses,
    totalOperatingExpenses,
    taxExpense,
    totalTaxExpense,
    netIncome,
  };
}

export interface BalanceSheet {
  asOfDate: string;
  assets: ReportLine[];
  totalAssets: number;
  liabilities: ReportLine[];
  totalLiabilities: number;
  equity: ReportLine[];
  retainedEarningsToDate: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

/** Automatic Balance Sheet as of a given date, rolling up net income into Retained Earnings. */
export function computeBalanceSheet(accounts: Account[], entries: JournalEntry[], asOfDate: string, businessInceptionDate: string): BalanceSheet {
  const active = accounts.filter((a) => !a.archived);

  const assets = active
    .filter((a) => a.type === "asset")
    .map((account) => ({ account, amount: getAccountBalance(account, entries, asOfDate) }))
    .filter((r) => r.amount !== 0);
  const totalAssets = round2(assets.reduce((s, r) => s + r.amount, 0));

  const liabilities = active
    .filter((a) => a.type === "liability")
    .map((account) => ({ account, amount: getAccountBalance(account, entries, asOfDate) }))
    .filter((r) => r.amount !== 0);
  const totalLiabilities = round2(liabilities.reduce((s, r) => s + r.amount, 0));

  const equity = active
    .filter((a) => a.type === "equity")
    .map((account) => ({ account, amount: getAccountBalance(account, entries, asOfDate) }))
    .filter((r) => r.amount !== 0);
  const equityFromAccounts = round2(equity.reduce((s, r) => s + r.amount, 0));

  // Net income earned since inception (not yet closed to equity accounts) rolls into Retained Earnings.
  const pl = computeProfitAndLoss(accounts, entries, businessInceptionDate, asOfDate);
  const retainedEarningsToDate = pl.netIncome;

  const totalEquity = round2(equityFromAccounts + retainedEarningsToDate);
  const totalLiabilitiesAndEquity = round2(totalLiabilities + totalEquity);

  return {
    asOfDate,
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    retainedEarningsToDate,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
  };
}

export interface CashFlowStatement {
  periodStart: string;
  periodEnd: string;
  beginningCash: number;
  netIncome: number;
  operatingAdjustments: { label: string; amount: number }[];
  netCashFromOperations: number;
  netCashFromInvesting: number;
  netCashFromFinancing: number;
  netChangeInCash: number;
  endingCash: number;
}

/**
 * Indirect-method Cash Flow Statement. Starts from Net Income and adjusts
 * for the change in every other balance-sheet account, grouped into
 * Operating (current assets/liabilities), Investing (fixed assets), and
 * Financing (equity and long-term debt) activities. Because Assets =
 * Liabilities + Equity always holds, this construction guarantees the
 * statement ties out exactly to the actual change in the cash accounts,
 * regardless of which accounts a transaction touches.
 */
export function computeCashFlow(accounts: Account[], entries: JournalEntry[], periodStart: string, periodEnd: string): CashFlowStatement {
  const cashAccounts = accounts.filter((a) => a.code === "1000" || a.code === "1010");
  const beginningCash = round2(cashAccounts.reduce((s, a) => s + getAccountBalance(a, entries, dayBefore(periodStart)), 0));
  const endingCash = round2(cashAccounts.reduce((s, a) => s + getAccountBalance(a, entries, periodEnd), 0));

  const pl = computeProfitAndLoss(accounts, entries, periodStart, periodEnd);
  const active = accounts.filter((a) => !a.archived && a.code !== "1000" && a.code !== "1010");

  const adjustments: { label: string; amount: number }[] = [];
  let netCashFromInvesting = 0;
  let netCashFromFinancing = 0;

  for (const account of active) {
    const change = balanceInPeriod(account, entries, periodStart, periodEnd);
    if (change === 0) continue;

    if (account.type === "asset" && account.subtype === "fixed_asset") {
      // A rise in fixed assets is a cash outflow to purchase them (investing).
      netCashFromInvesting = round2(netCashFromInvesting - change);
    } else if (account.type === "asset") {
      // A rise in a current asset (AR, Inventory, Prepaid, ...) consumes cash.
      adjustments.push({ label: `(Increase) / decrease in ${account.name}`, amount: round2(-change) });
    } else if (account.type === "liability" && account.subtype === "long_term_liability") {
      netCashFromFinancing = round2(netCashFromFinancing + change);
    } else if (account.type === "liability") {
      // A rise in a current liability (AP, Sales Tax Payable, ...) frees up cash.
      adjustments.push({ label: `Increase / (decrease) in ${account.name}`, amount: round2(change) });
    } else if (account.type === "equity") {
      // Owner contributions/draws are financing activity; net income is already the P&L starting point.
      netCashFromFinancing = round2(netCashFromFinancing + change);
    }
  }

  const netCashFromOperations = round2(pl.netIncome + adjustments.reduce((s, a) => s + a.amount, 0));

  const netChangeInCash = round2(netCashFromOperations + netCashFromInvesting + netCashFromFinancing);

  return {
    periodStart,
    periodEnd,
    beginningCash,
    netIncome: pl.netIncome,
    operatingAdjustments: adjustments,
    netCashFromOperations,
    netCashFromInvesting,
    netCashFromFinancing,
    netChangeInCash,
    endingCash,
  };
}

export interface TaxSummary {
  periodStart: string;
  periodEnd: string;
  salesTaxCollected: number;
  salesTaxPayableBalance: number;
  incomeTaxExpense: number;
  taxableNetIncome: number;
}

/** Automatic tax summary: sales tax collected/owed plus estimated income tax basis. */
export function computeTaxSummary(accounts: Account[], entries: JournalEntry[], periodStart: string, periodEnd: string): TaxSummary {
  const taxPayable = accounts.find((a) => a.code === "2100");
  const salesTaxCollected = taxPayable ? balanceInPeriod(taxPayable, entries, periodStart, periodEnd) : 0;
  const salesTaxPayableBalance = taxPayable ? getAccountBalance(taxPayable, entries, periodEnd) : 0;

  const pl = computeProfitAndLoss(accounts, entries, periodStart, periodEnd);

  return {
    periodStart,
    periodEnd,
    salesTaxCollected: round2(salesTaxCollected),
    salesTaxPayableBalance: round2(salesTaxPayableBalance),
    incomeTaxExpense: pl.totalTaxExpense,
    taxableNetIncome: round2(pl.grossProfit - pl.totalOperatingExpenses),
  };
}
