"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { getAccountLedger } from "@/lib/accounting/ledger";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AccountLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { business } = useAuth();
  const { accounts, journalEntries, loading } = useBusinessData();
  const account = accounts.find((a) => a.id === id);
  const rows = account ? getAccountLedger(account, journalEntries) : [];

  return (
    <AppShell title="Account Ledger">
      <Link href="/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft size={15} /> Back to Chart of Accounts
      </Link>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : !account ? (
        <p className="text-sm text-gray-500">Account not found.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{account.code} — {account.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{account.type} · {account.subtype.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-400">Current Balance</p>
              <p className="text-xl font-semibold num text-gray-900">
                {formatCurrency(rows.length ? rows[rows.length - 1].runningBalance : 0, business?.currency)}
              </p>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Debit</th>
                    <th className="px-5 py-3 text-right">Credit</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No activity posted to this account yet.</td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-2.5 text-gray-600">{formatDate(r.date)}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{r.reference}</td>
                      <td className="px-5 py-2.5 text-gray-700">{r.description}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right num text-gray-900">{r.debit ? formatCurrency(r.debit, business?.currency) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right num text-gray-900">{r.credit ? formatCurrency(r.credit, business?.currency) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right num font-medium text-gray-900">{formatCurrency(r.runningBalance, business?.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
