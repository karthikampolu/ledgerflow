"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { db } from "@/lib/data";
import { Invoice } from "@/lib/types";
import { todayIso, formatCurrency } from "@/lib/utils";

export function RecordPaymentModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { authUser, business } = useAuth();
  const { refreshAll } = useBusinessData();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState<"cash" | "bank">("bank");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;
  const remaining = Math.round((invoice.total - invoice.amountPaid + Number.EPSILON) * 100) / 100;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUser || !business || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid payment amount.");
      if (amt > remaining + 0.01) throw new Error(`Amount cannot exceed remaining balance of ${formatCurrency(remaining, business.currency)}.`);
      await db.recordInvoicePayment(business.id, invoice.id, amt, date, method, authUser);
      await refreshAll();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Record Payment — ${invoice.number}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{invoice.kind === "receivable" ? "Customer" : "Vendor"}</span>
            <span className="font-medium text-gray-900">{invoice.partyName}</span>
          </div>
          <div className="mt-1 flex justify-between text-gray-500">
            <span>Total</span>
            <span className="num">{formatCurrency(invoice.total, business?.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between text-gray-500">
            <span>Already paid</span>
            <span className="num">{formatCurrency(invoice.amountPaid, business?.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold text-gray-900">
            <span>Remaining</span>
            <span className="num">{formatCurrency(remaining, business?.currency)}</span>
          </div>
        </div>

        <Field label="Payment Amount">
          <Input type="number" min="0" step="0.01" max={remaining} required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={remaining.toFixed(2)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "bank")}>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
            </Select>
          </Field>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Recording…" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
