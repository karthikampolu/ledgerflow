"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { StatCard } from "@/components/ui/StatCard";
import { computeAging } from "@/lib/aging";
import { formatCurrency, todayIso } from "@/lib/utils";
import { useMemo } from "react";

export default function PayablesPage() {
  const { business } = useAuth();
  const { invoices, loading } = useBusinessData();
  const payables = invoices.filter((i) => i.kind === "payable");
  const aging = useMemo(() => computeAging(payables, todayIso()), [payables]);

  return (
    <AppShell title="Accounts Payable">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current" value={formatCurrency(aging.current, business?.currency)} />
        <StatCard label="1–30 Days Overdue" value={formatCurrency(aging.d1to30, business?.currency)} deltaTone="negative" />
        <StatCard label="31–60 Days Overdue" value={formatCurrency(aging.d31to60, business?.currency)} deltaTone="negative" />
        <StatCard label="61+ Days Overdue" value={formatCurrency(aging.d61plus, business?.currency)} deltaTone="negative" />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <InvoiceTable invoices={payables} emptyLabel="No open payables." />
      )}
    </AppShell>
  );
}
