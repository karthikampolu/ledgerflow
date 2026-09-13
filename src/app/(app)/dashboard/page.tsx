"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { currencySymbol, formatCurrency, formatDate, startOfMonth, startOfYear, todayIso } from "@/lib/utils";
import { computeProfitAndLoss } from "@/lib/accounting/reports";
import { getAccountBalance } from "@/lib/accounting/ledger";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Inbox, Send } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function DashboardPage() {
  const { business } = useAuth();
  const { accounts, journalEntries, transactions, invoices, loading } = useBusinessData();

  const today = todayIso();

  const kpis = useMemo(() => {
    if (accounts.length === 0) return null;
    const cash = accounts.filter((a) => a.code === "1000" || a.code === "1010");
    const cashBalance = cash.reduce((s, a) => s + getAccountBalance(a, journalEntries, today), 0);
    const ar = accounts.find((a) => a.code === "1200");
    const ap = accounts.find((a) => a.code === "2000");
    const arBalance = ar ? getAccountBalance(ar, journalEntries, today) : 0;
    const apBalance = ap ? getAccountBalance(ap, journalEntries, today) : 0;
    const mtd = computeProfitAndLoss(accounts, journalEntries, startOfMonth(today), today);
    const ytd = computeProfitAndLoss(accounts, journalEntries, startOfYear(today), today);
    return { cashBalance, arBalance, apBalance, mtd, ytd };
  }, [accounts, journalEntries, today]);

  const monthlyTrend = useMemo(() => {
    if (accounts.length === 0) return [];
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }) });
    }
    return months.map(({ key, label }) => {
      const start = key + "-01";
      const end = new Date(key + "-01T00:00:00");
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      const pl = computeProfitAndLoss(accounts, journalEntries, start, end.toISOString().slice(0, 10));
      return { month: label, revenue: pl.totalRevenue, expenses: pl.totalCogs + pl.totalOperatingExpenses, netIncome: pl.netIncome };
    });
  }, [accounts, journalEntries]);

  const recentTransactions = transactions.slice(0, 6);
  const overdueInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "void" && i.dueDate < today);

  return (
    <AppShell title="Dashboard">
      {loading || !kpis ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading your business data…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cash & Bank" value={formatCurrency(kpis.cashBalance, business?.currency)} icon={<Wallet size={16} />} tone="brand" />
            <StatCard
              label="Net Income (MTD)"
              value={formatCurrency(kpis.mtd.netIncome, business?.currency)}
              delta={`${formatCurrency(kpis.mtd.totalRevenue, business?.currency)} revenue`}
              deltaTone={kpis.mtd.netIncome >= 0 ? "positive" : "negative"}
              icon={kpis.mtd.netIncome >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              tone={kpis.mtd.netIncome >= 0 ? "positive" : "negative"}
            />
            <StatCard label="Accounts Receivable" value={formatCurrency(kpis.arBalance, business?.currency)} icon={<Inbox size={16} />} tone="brand" />
            <StatCard label="Accounts Payable" value={formatCurrency(kpis.apBalance, business?.currency)} icon={<Send size={16} />} tone="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue vs. Expenses" subtitle="Last 6 months" />
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyTrend} margin={{ left: -10 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b3df0" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#5b3df0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySymbol(business?.currency)}${v / 1000}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v), business?.currency)} contentStyle={{ borderRadius: 10, border: "1px solid #e6e8ef", boxShadow: "0 8px 24px -12px rgba(16,17,28,0.18)" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#5b3df0" fill="url(#rev)" strokeWidth={2.5} name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="#e11d48" fill="url(#exp)" strokeWidth={2.5} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Net Income" subtitle="Last 6 months" />
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrend} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySymbol(business?.currency)}${v / 1000}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v), business?.currency)} contentStyle={{ borderRadius: 10, border: "1px solid #e6e8ef", boxShadow: "0 8px 24px -12px rgba(16,17,28,0.18)" }} />
                    <Bar dataKey="netIncome" radius={[6, 6, 0, 0]} fill="#0d9488" name="Net Income" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Recent Transactions" action={<Link href="/transactions" className="text-xs font-medium text-[var(--brand)] hover:underline">View all</Link>} />
              <div className="divide-y divide-gray-100">
                {recentTransactions.length === 0 && <p className="p-5 text-sm text-gray-400">No transactions yet.</p>}
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{t.type} — {t.partyName}</p>
                      <p className="text-xs text-gray-500">{formatDate(t.date)} · {t.paymentMethod}</p>
                    </div>
                    <span className={`text-sm font-semibold num ${["purchase", "expense", "payment"].includes(t.type) ? "text-red-600" : "text-emerald-600"}`}>
                      {["purchase", "expense", "payment"].includes(t.type) ? "-" : "+"}
                      {formatCurrency(t.totalAmount, business?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Overdue Invoices" action={<Link href="/receivables" className="text-xs font-medium text-[var(--brand)] hover:underline">View all</Link>} />
              <div className="divide-y divide-gray-100">
                {overdueInvoices.length === 0 && <p className="p-5 text-sm text-gray-400">Nothing overdue. 🎉</p>}
                {overdueInvoices.slice(0, 6).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.number}</p>
                      <p className="text-xs text-gray-500">{inv.partyName} · due {formatDate(inv.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold num text-gray-900">{formatCurrency(inv.total - inv.amountPaid, business?.currency)}</p>
                      <Badge tone={statusTone("overdue")}>overdue</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <DollarSign size={14} /> All figures computed automatically from posted double-entry journal entries.
          </div>
        </div>
      )}
    </AppShell>
  );
}
