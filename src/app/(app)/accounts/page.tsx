"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Archive } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAccountBalance } from "@/lib/accounting/ledger";
import { formatCurrency, todayIso } from "@/lib/utils";
import { NewAccountModal } from "@/components/accounts/NewAccountModal";
import { AccountType } from "@/lib/types";
import { db } from "@/lib/data";

const TYPE_ORDER: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
};

export default function AccountsPage() {
  const { authUser, business } = useAuth();
  const { accounts, journalEntries, refreshAll, loading } = useBusinessData();
  const [modalOpen, setModalOpen] = useState(false);
  const today = todayIso();

  const grouped = useMemo(() => {
    const active = accounts.filter((a) => !a.archived).sort((a, b) => a.code.localeCompare(b.code));
    return TYPE_ORDER.map((type) => ({ type, list: active.filter((a) => a.type === type) }));
  }, [accounts]);

  async function handleArchive(id: string) {
    if (!authUser || !business) return;
    if (!confirm("Archive this account? It will be hidden from new transactions but ledger history is preserved.")) return;
    await db.archiveAccount(business.id, id, authUser);
    await refreshAll();
  }

  return (
    <AppShell title="Chart of Accounts">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{accounts.filter((a) => !a.archived).length} active accounts</p>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Account
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, list }) => (
            <Card key={type}>
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-900">{TYPE_LABEL[type]}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-2">Code</th>
                      <th className="px-5 py-2">Name</th>
                      <th className="px-5 py-2">Subtype</th>
                      <th className="px-5 py-2 text-right">Balance</th>
                      <th className="px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-gray-400">No accounts.</td>
                      </tr>
                    )}
                    {list.map((a) => {
                      const balance = getAccountBalance(a, journalEntries, today);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{a.code}</td>
                          <td className="px-5 py-2.5">
                            <Link href={`/accounts/${a.id}`} className="font-medium text-gray-900 hover:text-indigo-700 hover:underline">
                              {a.name}
                            </Link>
                            {a.isSystem && <Badge tone="gray" className="ml-2">system</Badge>}
                          </td>
                          <td className="px-5 py-2.5 capitalize text-gray-500">{a.subtype.replace(/_/g, " ")}</td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-right num font-medium text-gray-900">{formatCurrency(balance, business?.currency)}</td>
                          <td className="px-5 py-2.5 text-right">
                            {!a.isSystem && (
                              <button onClick={() => handleArchive(a.id)} className="text-gray-400 hover:text-red-600" title="Archive">
                                <Archive size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
