"use client";

import { Printer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Invoice } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate, todayIso } from "@/lib/utils";

/**
 * Renders a real, formatted invoice/bill document — not just a table row.
 * The #invoice-print-area is isolated via print CSS (globals.css) so
 * "Print / Save as PDF" produces a clean document with no app chrome.
 */
export function InvoiceDocumentModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { business } = useAuth();
  if (!invoice) return null;

  const balance = Math.round((invoice.total - invoice.amountPaid + Number.EPSILON) * 100) / 100;
  const docLabel = invoice.kind === "receivable" ? "Invoice" : "Bill";
  const today = todayIso();
  const status = invoice.status === "paid" || invoice.status === "void" ? invoice.status : invoice.dueDate < today ? "overdue" : invoice.status;

  return (
    <Modal open={!!invoice} onClose={onClose} title={`${docLabel} ${invoice.number}`} wide>
      <div className="mb-4 flex justify-end no-print">
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={14} /> Print / Save as PDF
        </Button>
      </div>

      <div id="invoice-print-area" className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{business?.name}</h2>
            <p className="text-sm text-gray-500">{business?.industry}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-semibold uppercase tracking-wide text-gray-700">{docLabel}</h3>
            <p className="text-sm text-gray-500">{invoice.number}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {invoice.kind === "receivable" ? "Bill To" : "Vendor"}
            </p>
            <p className="mt-1 font-medium text-gray-900">{invoice.partyName}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">
              <span className="text-gray-400">Issue date: </span>
              {formatDate(invoice.issueDate)}
            </p>
            <p className="text-gray-600">
              <span className="text-gray-400">Due date: </span>
              {formatDate(invoice.dueDate)}
            </p>
            <div className="mt-1.5 flex justify-end">
              <Badge tone={statusTone(status)}>{status.replace("_", " ")}</Badge>
            </div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.lineItems.map((li, i) => (
              <tr key={i}>
                <td className="py-2.5 text-gray-700">{li.description}</td>
                <td className="py-2.5 text-right text-gray-600">{li.quantity}</td>
                <td className="py-2.5 text-right num text-gray-600">{formatCurrency(li.unitPrice, business?.currency)}</td>
                <td className="py-2.5 text-right num text-gray-900">{formatCurrency(li.amount, business?.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="num">{formatCurrency(invoice.subtotal, business?.currency)}</span>
            </div>
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="num">{formatCurrency(invoice.taxAmount, business?.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900">
              <span>Total</span>
              <span className="num">{formatCurrency(invoice.total, business?.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Amount Paid</span>
              <span className="num">{formatCurrency(invoice.amountPaid, business?.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-bold text-gray-900">
              <span>Balance Due</span>
              <span className="num">{formatCurrency(balance, business?.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.memo && (
          <div className="mt-8 border-t border-gray-100 pt-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
            <p className="mt-1 text-gray-600">{invoice.memo}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-gray-400">Generated by LedgerFlow &middot; {docLabel} {invoice.number}</p>
      </div>
    </Modal>
  );
}
