"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { db } from "@/lib/data";
import { PaymentMethod, TransactionType } from "@/lib/types";
import { todayIso, isoDaysFromNow, formatCurrency } from "@/lib/utils";
import { computeTaxAmount } from "@/lib/accounting/rules";

const TYPE_LABEL: Record<TransactionType, string> = {
  sale: "Sale",
  purchase: "Purchase",
  expense: "Expense",
  receipt: "Payment Received (Receipt)",
  payment: "Payment Made (to Vendor)",
};

export function TransactionModal({ open, onClose, defaultType }: { open: boolean; onClose: () => void; defaultType?: TransactionType }) {
  const { authUser, business } = useAuth();
  const { accounts, refreshAll } = useBusinessData();
  const [type, setType] = useState<TransactionType>(defaultType || "sale");
  const [date, setDate] = useState(todayIso());
  // Opened from the Invoices & Bills page (defaultType set) implies the user
  // wants an invoice/bill out of this — those only get generated for credit
  // transactions, so default to Credit in that context instead of Bank.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultType ? "credit" : "bank");
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState(business?.taxRateDefault?.toString() || "0");
  const [partyName, setPartyName] = useState("");
  const [categoryAccountId, setCategoryAccountId] = useState("");
  const [memo, setMemo] = useState("");
  const [makeInvoice, setMakeInvoice] = useState(true);
  const [dueDate, setDueDate] = useState(isoDaysFromNow(30));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseAccounts = accounts.filter((a) => a.type === "expense" && a.subtype === "operating_expense");
  const isCredit = paymentMethod === "credit";
  const numericAmount = parseFloat(amount) || 0;
  const numericTaxRate = parseFloat(taxRate) || 0;
  const taxAmount = computeTaxAmount(numericAmount, numericTaxRate);
  const total = Math.round((numericAmount + taxAmount + Number.EPSILON) * 100) / 100;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUser || !business) return;
    setBusy(true);
    setError(null);
    try {
      const tx = await db.recordTransaction(
        business.id,
        {
          type,
          date,
          paymentMethod,
          amount: numericAmount,
          taxRate: type === "sale" ? numericTaxRate : type === "purchase" ? 0 : numericTaxRate,
          partyName,
          category: type === "expense" ? categoryAccountId : undefined,
          accountId: type === "expense" ? categoryAccountId : undefined,
          memo,
        },
        authUser
      );

      if (isCredit && (type === "sale" || type === "purchase") && makeInvoice) {
        await db.createInvoiceFromTransaction(business.id, tx, type === "sale" ? "receivable" : "payable", dueDate, authUser);
      }

      await refreshAll();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record transaction.");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setAmount("");
    setPartyName("");
    setMemo("");
    setCategoryAccountId("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Record a Transaction" wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Transaction Type">
          <Select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field
            label="Payment Method"
            hint={
              (type === "sale" || type === "purchase") && paymentMethod !== "credit"
                ? `Switch to "On Credit" to auto-generate ${type === "sale" ? "an invoice" : "a bill"}`
                : undefined
            }
          >
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              {(type === "sale" || type === "purchase" || type === "expense") && <option value="credit">On Credit</option>}
            </Select>
          </Field>
        </div>

        <Field label={type === "receipt" ? "Customer Name" : type === "payment" ? "Vendor Name" : "Party Name"}>
          <Input required value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="e.g. Blue Bottle Café" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (pre-tax)">
            <Input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          {(type === "sale" || type === "purchase") && (
            <Field label="Tax Rate (%)">
              <Input type="number" min="0" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </Field>
          )}
        </div>

        {type === "expense" && (
          <Field label="Expense Category">
            <Select required value={categoryAccountId} onChange={(e) => setCategoryAccountId(e.target.value)}>
              <option value="">Select category…</option>
              {expenseAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Memo (optional)">
          <Textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Notes about this transaction" />
        </Field>

        {isCredit && (type === "sale" || type === "purchase") && (
          <div className="rounded-lg border border-[var(--brand-light)] bg-[var(--brand-light)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--brand-dark)]">
              <input type="checkbox" checked={makeInvoice} onChange={(e) => setMakeInvoice(e.target.checked)} className="rounded" />
              Automatically generate {type === "sale" ? "an invoice" : "a bill"}
            </label>
            {makeInvoice && (
              <div className="mt-3">
                <Field label="Due Date">
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Total amount</span>
          <span className="font-semibold text-gray-900 num">{formatCurrency(total, business?.currency)}</span>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Posting…" : "Post Transaction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
