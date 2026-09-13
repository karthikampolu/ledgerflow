"use client";

import { useMemo, useState } from "react";
import { Upload, Check, X, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CsvImportModal } from "@/components/bank/CsvImportModal";
import { suggestMatches } from "@/lib/accounting/reconciliation";
import { db } from "@/lib/data";

export default function BankPage() {
  const { authUser, business } = useAuth();
  const { bankTransactions, transactions, refreshAll, loading } = useBusinessData();
  const [importOpen, setImportOpen] = useState(false);
  const [manualSelection, setManualSelection] = useState<Record<string, string>>({});

  const suggestions = useMemo(() => suggestMatches(bankTransactions, transactions), [bankTransactions, transactions]);
  const suggestionByBankId = useMemo(() => new Map(suggestions.map((s) => [s.bankTransactionId, s])), [suggestions]);

  const unmatched = bankTransactions.filter((b) => b.status === "unmatched");
  const matched = bankTransactions.filter((b) => b.status === "matched");
  const ignored = bankTransactions.filter((b) => b.status === "ignored");

  async function confirmMatch(bankTransactionId: string, transactionId: string) {
    if (!authUser || !business || !transactionId) return;
    await db.matchBankTransaction(business.id, bankTransactionId, transactionId, authUser);
    await refreshAll();
  }

  async function ignore(bankTransactionId: string) {
    if (!authUser || !business) return;
    await db.ignoreBankTransaction(business.id, bankTransactionId, authUser);
    await refreshAll();
  }

  function txLabel(id?: string) {
    const t = transactions.find((tx) => tx.id === id);
    return t ? `${t.date} · ${t.partyName} · ${formatCurrency(t.totalAmount, business?.currency)}` : "—";
  }

  return (
    <AppShell title="Bank & Reconciliation">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {matched.length} matched · {unmatched.length} unmatched · {ignored.length} ignored
        </p>
        <Button onClick={() => setImportOpen(true)}>
          <Upload size={16} /> Import Bank CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Needs Review ({unmatched.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {unmatched.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Everything is reconciled. 🎉</p>}
              {unmatched.map((b) => {
                const suggestion = suggestionByBankId.get(b.id);
                const selected = manualSelection[b.id] ?? suggestion?.transactionId ?? "";
                return (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-[220px]">
                      <p className="text-sm font-medium text-gray-900">{b.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(b.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold num ${b.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(b.amount, business?.currency)}
                    </span>
                    {suggestion && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        <Sparkles size={11} /> Suggested match ({Math.round(suggestion.confidence * 100)}%)
                      </span>
                    )}
                    <Select
                      className="w-64"
                      value={selected}
                      onChange={(e) => setManualSelection((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    >
                      <option value="">Select a transaction to match…</option>
                      {transactions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {txLabel(t.id)}
                        </option>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => confirmMatch(b.id, selected)} disabled={!selected}>
                        <Check size={14} /> Match
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => ignore(b.id)}>
                        <X size={14} /> Ignore
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Reconciled Bank Feed</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Matched Transaction</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...matched, ...ignored].length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No reconciled transactions yet.</td>
                    </tr>
                  )}
                  {[...matched, ...ignored].map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-2.5 text-gray-600">{formatDate(b.date)}</td>
                      <td className="px-5 py-2.5 text-gray-700">{b.description}</td>
                      <td className="px-5 py-2.5 text-gray-500">{b.matchedTransactionId ? txLabel(b.matchedTransactionId) : "—"}</td>
                      <td className={`whitespace-nowrap px-5 py-2.5 text-right num font-medium ${b.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(b.amount, business?.currency)}
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </AppShell>
  );
}
