"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { db } from "@/lib/data";
import { Transaction } from "@/lib/types";
import { isoDaysFromNow, formatCurrency } from "@/lib/utils";

/**
 * Retroactively generates an invoice/bill for a Sale or Purchase
 * transaction that was recorded without one (e.g. it was entered as
 * Cash/Bank rather than On Credit). Does not change the original
 * transaction's posted journal entry — it only creates the document.
 */
export function GenerateInvoiceModal({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const { authUser, business } = useAuth();
  const { refreshAll } = useBusinessData();
  const [dueDate, setDueDate] = useState(isoDaysFromNow(30));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;
  const kind = transaction.type === "sale" ? "receivable" : "payable";
  const docLabel = kind === "receivable" ? "invoice" : "bill";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUser || !business || !transaction) return;
    setBusy(true);
    setError(null);
    try {
      await db.createInvoiceFromTransaction(business.id, transaction, kind, dueDate, authUser);
      await refreshAll();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${docLabel}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!transaction} onClose={onClose} title={`Generate ${docLabel === "invoice" ? "Invoice" : "Bill"}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{kind === "receivable" ? "Customer" : "Vendor"}</span>
            <span className="font-medium text-gray-900">{transaction.partyName}</span>
          </div>
          <div className="mt-1 flex justify-between text-gray-500">
            <span>Transaction date</span>
            <span>{transaction.date}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold text-gray-900">
            <span>Amount</span>
            <span className="num">{formatCurrency(transaction.totalAmount, business?.currency)}</span>
          </div>
        </div>

        <Field label="Due Date">
          <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Generating…" : `Generate ${docLabel === "invoice" ? "Invoice" : "Bill"}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
