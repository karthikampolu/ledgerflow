"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionType } from "@/lib/types";

const OUTFLOW_TYPES: TransactionType[] = ["purchase", "expense", "payment"];

export default function TransactionsPage() {
  const { business } = useAuth();
  const { transactions, loading } = useBusinessData();
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (typeFilter === "all") return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  return (
    <AppShell title="Transactions">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48">
            <option value="all">All types</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
            <option value="expense">Expenses</option>
            <option value="receipt">Receipts</option>
            <option value="payment">Payments</option>
          </Select>
          <span className="text-sm text-gray-500">{filtered.length} transactions</span>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Record Transaction
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Party</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Memo</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No transactions recorded yet.</td>
                </tr>
              )}
              {filtered.map((t) => {
                const outflow = OUTFLOW_TYPES.includes(t.type);
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">{formatDate(t.date)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={outflow ? "red" : "green"}>{t.type}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{t.partyName}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{t.paymentMethod}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-gray-500">{t.memo || "—"}</td>
                    <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold num ${outflow ? "text-red-600" : "text-emerald-600"}`}>
                      {outflow ? "-" : "+"}
                      {formatCurrency(t.totalAmount, business?.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
