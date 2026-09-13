"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, todayIso } from "@/lib/utils";
import { Invoice } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { RecordPaymentModal } from "@/components/invoices/RecordPaymentModal";
import { InvoiceDocumentModal } from "@/components/invoices/InvoiceDocumentModal";

export function InvoiceTable({ invoices, emptyLabel }: { invoices: Invoice[]; emptyLabel: string }) {
  const { business } = useAuth();
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const today = todayIso();

  function effectiveStatus(inv: Invoice): string {
    if (inv.status === "paid" || inv.status === "void") return inv.status;
    if (inv.dueDate < today) return "overdue";
    return inv.status;
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Number</th>
              <th className="px-5 py-3">Party</th>
              <th className="px-5 py-3">Issued</th>
              <th className="px-5 py-3">Due</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-right">Balance</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400">{emptyLabel}</td>
              </tr>
            )}
            {invoices.map((inv) => {
              const balance = Math.round((inv.total - inv.amountPaid + Number.EPSILON) * 100) / 100;
              const status = effectiveStatus(inv);
              return (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="text-[var(--brand)] hover:underline"
                      title="View invoice"
                    >
                      {inv.number}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{inv.partyName}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right num text-gray-900">{formatCurrency(inv.total, business?.currency)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right num font-semibold text-gray-900">{formatCurrency(balance, business?.currency)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(status)}>{status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setViewingInvoice(inv)}>
                        <Eye size={13} /> View
                      </Button>
                      {balance > 0 && (
                        <Button size="sm" variant="secondary" onClick={() => setPayingInvoice(inv)}>
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <RecordPaymentModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />
      <InvoiceDocumentModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
    </Card>
  );
}
