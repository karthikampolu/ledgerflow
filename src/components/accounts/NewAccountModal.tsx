"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { db } from "@/lib/data";
import { AccountSubtype, AccountType } from "@/lib/types";

const TYPE_SUBTYPES: Record<AccountType, AccountSubtype[]> = {
  asset: ["current_asset", "fixed_asset"],
  liability: ["current_liability", "long_term_liability"],
  equity: ["equity"],
  revenue: ["operating_revenue", "other_revenue"],
  expense: ["cogs", "operating_expense", "tax_expense"],
};

export function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { authUser, business } = useAuth();
  const { accounts, refreshAll } = useBusinessData();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("expense");
  const [subtype, setSubtype] = useState<AccountSubtype>("operating_expense");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUser || !business) return;
    setBusy(true);
    setError(null);
    try {
      if (accounts.some((a) => a.code === code)) throw new Error("An account with this code already exists.");
      await db.createAccount(business.id, { code, name, type, subtype, description, isSystem: false }, authUser);
      await refreshAll();
      onClose();
      setCode("");
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account Code">
            <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 6800" />
          </Field>
          <Field label="Account Type">
            <Select
              value={type}
              onChange={(e) => {
                const t = e.target.value as AccountType;
                setType(t);
                setSubtype(TYPE_SUBTYPES[t][0]);
              }}
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </Select>
          </Field>
        </div>
        <Field label="Account Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Software Subscriptions" />
        </Field>
        <Field label="Subtype">
          <Select value={subtype} onChange={(e) => setSubtype(e.target.value as AccountSubtype)}>
            {TYPE_SUBTYPES[type].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description (optional)">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
