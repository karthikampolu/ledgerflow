"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Form";
import { formatCurrency, startOfMonth, startOfYear, todayIso } from "@/lib/utils";
import { computeProfitAndLoss, computeBalanceSheet, computeCashFlow, computeTaxSummary } from "@/lib/accounting/reports";

type Tab = "pnl" | "balance" | "cashflow" | "tax";

const TABS: { key: Tab; label: string }[] = [
  { key: "pnl", label: "Profit & Loss" },
  { key: "balance", label: "Balance Sheet" },
  { key: "cashflow", label: "Cash Flow" },
  { key: "tax", label: "Tax Summary" },
];

export default function ReportsPage() {
  const { business } = useAuth();
  const { accounts, journalEntries, loading } = useBusinessData();
  const [tab, setTab] = useState<Tab>("pnl");
  const today = todayIso();
  const [periodStart, setPeriodStart] = useState(startOfMonth(today));
  const [periodEnd, setPeriodEnd] = useState(today);
  const currency = business?.currency;
  const inceptionDate = business?.createdAt.slice(0, 10) || startOfYear(today);

  const pnl = useMemo(() => computeProfitAndLoss(accounts, journalEntries, periodStart, periodEnd), [accounts, journalEntries, periodStart, periodEnd]);
  const balanceSheet = useMemo(() => computeBalanceSheet(accounts, journalEntries, periodEnd, inceptionDate), [accounts, journalEntries, periodEnd, inceptionDate]);
  const cashFlow = useMemo(() => computeCashFlow(accounts, journalEntries, periodStart, periodEnd), [accounts, journalEntries, periodStart, periodEnd]);
  const taxSummary = useMemo(() => computeTaxSummary(accounts, journalEntries, periodStart, periodEnd), [accounts, journalEntries, periodStart, periodEnd]);

  function quickRange(kind: "mtd" | "ytd" | "last30") {
    if (kind === "mtd") setPeriodStart(startOfMonth(today));
    if (kind === "ytd") setPeriodStart(startOfYear(today));
    if (kind === "last30") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setPeriodStart(d.toISOString().slice(0, 10));
    }
    setPeriodEnd(today);
  }

  return (
    <AppShell title="Reports">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === t.key ? "bg-[var(--brand)] text-white" : "text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => quickRange("mtd")} className="text-xs font-medium text-[var(--brand)] hover:underline">This Month</button>
          <button onClick={() => quickRange("last30")} className="text-xs font-medium text-[var(--brand)] hover:underline">Last 30 Days</button>
          <button onClick={() => quickRange("ytd")} className="text-xs font-medium text-[var(--brand)] hover:underline">Year to Date</button>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-40" />
          <span className="text-gray-400">to</span>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-40" />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          {tab === "pnl" && (
            <Card>
              <CardHeader title="Profit & Loss" subtitle={`${periodStart} to ${periodEnd}`} />
              <CardBody className="space-y-5">
                <ReportSection title="Revenue" lines={pnl.revenue} total={pnl.totalRevenue} currency={currency} />
                <ReportSection title="Cost of Goods Sold" lines={pnl.cogs} total={pnl.totalCogs} currency={currency} />
                <TotalRow label="Gross Profit" value={pnl.grossProfit} currency={currency} emphasis />
                <ReportSection title="Operating Expenses" lines={pnl.operatingExpenses} total={pnl.totalOperatingExpenses} currency={currency} />
                <ReportSection title="Tax Expense" lines={pnl.taxExpense} total={pnl.totalTaxExpense} currency={currency} />
                <TotalRow label="Net Income" value={pnl.netIncome} currency={currency} emphasis positiveIsGood />
              </CardBody>
            </Card>
          )}

          {tab === "balance" && (
            <Card>
              <CardHeader title="Balance Sheet" subtitle={`As of ${periodEnd}`} />
              <CardBody className="space-y-5">
                <ReportSection title="Assets" lines={balanceSheet.assets} total={balanceSheet.totalAssets} currency={currency} />
                <ReportSection title="Liabilities" lines={balanceSheet.liabilities} total={balanceSheet.totalLiabilities} currency={currency} />
                <div>
                  <ReportSection title="Equity" lines={balanceSheet.equity} total={null} currency={currency} />
                  <div className="flex items-center justify-between px-1 py-1 text-sm text-gray-600">
                    <span>Retained Earnings (to date)</span>
                    <span className="num">{formatCurrency(balanceSheet.retainedEarningsToDate, currency)}</span>
                  </div>
                  <TotalRow label="Total Equity" value={balanceSheet.totalEquity} currency={currency} />
                </div>
                <TotalRow label="Total Liabilities + Equity" value={balanceSheet.totalLiabilitiesAndEquity} currency={currency} emphasis />
                <div className={`rounded-lg px-4 py-2 text-xs font-medium ${balanceSheet.isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {balanceSheet.isBalanced ? "✓ Assets = Liabilities + Equity" : "⚠ Balance sheet does not balance"}
                </div>
              </CardBody>
            </Card>
          )}

          {tab === "cashflow" && (
            <Card>
              <CardHeader title="Cash Flow Statement" subtitle={`${periodStart} to ${periodEnd} · Indirect Method`} />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Beginning Cash Balance</span>
                  <span className="num">{formatCurrency(cashFlow.beginningCash, currency)}</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Operating Activities</p>
                  <div className="flex items-center justify-between px-1 py-1 text-sm text-gray-600">
                    <span>Net Income</span>
                    <span className="num">{formatCurrency(cashFlow.netIncome, currency)}</span>
                  </div>
                  {cashFlow.operatingAdjustments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-1 py-1 text-sm text-gray-600">
                      <span>{a.label}</span>
                      <span className="num">{formatCurrency(a.amount, currency)}</span>
                    </div>
                  ))}
                  <TotalRow label="Net Cash from Operations" value={cashFlow.netCashFromOperations} currency={currency} />
                </div>
                <TotalRow label="Net Cash from Investing" value={cashFlow.netCashFromInvesting} currency={currency} />
                <TotalRow label="Net Cash from Financing" value={cashFlow.netCashFromFinancing} currency={currency} />
                <TotalRow label="Net Change in Cash" value={cashFlow.netChangeInCash} currency={currency} emphasis />
                <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                  <span>Ending Cash Balance</span>
                  <span className="num">{formatCurrency(cashFlow.endingCash, currency)}</span>
                </div>
              </CardBody>
            </Card>
          )}

          {tab === "tax" && (
            <Card>
              <CardHeader title="Tax Summary" subtitle={`${periodStart} to ${periodEnd}`} />
              <CardBody className="space-y-4">
                <TotalRow label="Sales Tax Collected (this period)" value={taxSummary.salesTaxCollected} currency={currency} />
                <TotalRow label="Sales Tax Payable (current balance)" value={taxSummary.salesTaxPayableBalance} currency={currency} />
                <TotalRow label="Taxable Net Income (before income tax)" value={taxSummary.taxableNetIncome} currency={currency} />
                <TotalRow label="Income Tax Expense Recorded" value={taxSummary.incomeTaxExpense} currency={currency} emphasis />
                <p className="pt-2 text-xs text-gray-400">
                  Sales tax payable represents the balance owed to the tax authority. Income tax expense reflects only amounts you have explicitly recorded to the Income Tax Expense account.
                </p>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}

function ReportSection({ title, lines, total, currency }: { title: string; lines: { account: { id: string; name: string; code: string }; amount: number }[]; total: number | null; currency?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {lines.length === 0 && <p className="px-1 py-1 text-sm text-gray-400">No activity</p>}
      {lines.map((l) => (
        <div key={l.account.id} className="flex items-center justify-between px-1 py-1 text-sm text-gray-600">
          <span>{l.account.name}</span>
          <span className="num">{formatCurrency(l.amount, currency)}</span>
        </div>
      ))}
      {total !== null && <TotalRow label={`Total ${title}`} value={total} currency={currency} />}
    </div>
  );
}

function TotalRow({ label, value, currency, emphasis, positiveIsGood }: { label: string; value: number; currency?: string; emphasis?: boolean; positiveIsGood?: boolean }) {
  const colorClass = positiveIsGood ? (value >= 0 ? "text-emerald-600" : "text-red-600") : "text-gray-900";
  return (
    <div className={`flex items-center justify-between border-t border-gray-100 px-1 pt-2 text-sm ${emphasis ? "font-semibold" : "font-medium"}`}>
      <span className="text-gray-900">{label}</span>
      <span className={`num ${colorClass}`}>{formatCurrency(value, currency)}</span>
    </div>
  );
}
