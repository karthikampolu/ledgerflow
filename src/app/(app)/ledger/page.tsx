"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { computeTrialBalance } from "@/lib/accounting/ledger";
import { formatCurrency, formatDate, todayIso } from "@/lib/utils";

export default function GeneralLedgerPage() {
  const { business } = useAuth();
  const { accounts, journalEntries, loading } = useBusinessData();
  const [tab, setTab] = useState<"journal" | "trial">("journal");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedEntries = useMemo(
    () => [...journalEntries].sort((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference)),
    [journalEntries]
  );
  const trialBalance = useMemo(() => computeTrialBalance(accounts, journalEntries, todayIso()), [accounts, journalEntries]);
  const totalDebit = trialBalance.reduce((s, r) => s + r.debit, 0);
  const totalCredit = trialBalance.reduce((s, r) => s + r.credit, 0);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <AppShell title="General Ledger">
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button onClick={() => setTab("journal")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "journal" ? "bg-indigo-700 text-white" : "text-gray-600"}`}>
          Journal Entries
        </button>
        <button onClick={() => setTab("trial")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "trial" ? "bg-indigo-700 text-white" : "text-gray-600"}`}>
          Trial Balance
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : tab === "journal" ? (
        <Card>
          <div className="divide-y divide-gray-100">
            {sortedEntries.length === 0 && <p className="p-10 text-center text-sm text-gray-400">No journal entries posted yet.</p>}
            {sortedEntries.map((je) => {
              const isOpen = expanded.has(je.id);
              return (
                <div key={je.id}>
                  <button onClick={() => toggle(je.id)} className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{je.reference} — {je.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(je.date)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold num text-gray-900">{formatCurrency(je.totalDebit, business?.currency)}</span>
                  </button>
                  {isOpen && (
                    <div className="bg-gray-50 px-5 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left uppercase tracking-wide text-gray-400">
                            <th className="py-1.5">Account</th>
                            <th className="py-1.5 text-right">Debit</th>
                            <th className="py-1.5 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {je.lines.map((l, i) => (
                            <tr key={i} className="border-t border-gray-200">
                              <td className="py-1.5 text-gray-700">{l.accountCode} — {l.accountName}</td>
                              <td className="py-1.5 text-right num text-gray-900">{l.debit ? formatCurrency(l.debit, business?.currency) : ""}</td>
                              <td className="py-1.5 text-right num text-gray-900">{l.credit ? formatCurrency(l.credit, business?.currency) : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3 text-right">Debit</th>
                  <th className="px-5 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trialBalance.map((row) => (
                  <tr key={row.account.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{row.account.code}</td>
                    <td className="px-5 py-2.5 text-gray-900">{row.account.name}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right num text-gray-900">{row.debit ? formatCurrency(row.debit, business?.currency) : "—"}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right num text-gray-900">{row.credit ? formatCurrency(row.credit, business?.currency) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td colSpan={2} className="px-5 py-3 text-gray-900">Total</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right num text-gray-900">{formatCurrency(totalDebit, business?.currency)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right num text-gray-900">{formatCurrency(totalCredit, business?.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className={`px-5 pb-4 text-xs font-medium ${Math.abs(totalDebit - totalCredit) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
            {Math.abs(totalDebit - totalCredit) < 0.01 ? "✓ Debits equal credits — books are balanced." : "⚠ Debits and credits do not match."}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
