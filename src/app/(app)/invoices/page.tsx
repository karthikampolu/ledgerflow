"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { TransactionModal } from "@/components/transactions/TransactionModal";

export default function InvoicesPage() {
  const { invoices, loading } = useBusinessData();
  const [tab, setTab] = useState<"receivable" | "payable">("receivable");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = invoices.filter((i) => i.kind === tab);

  return (
    <AppShell title="Invoices & Bills">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab("receivable")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "receivable" ? "bg-[var(--brand)] text-white" : "text-gray-600"}`}
          >
            Customer Invoices
          </button>
          <button
            onClick={() => setTab("payable")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "payable" ? "bg-[var(--brand)] text-white" : "text-gray-600"}`}
          >
            Vendor Bills
          </button>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New {tab === "receivable" ? "Sale (Invoice)" : "Purchase (Bill)"}
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <InvoiceTable invoices={filtered} emptyLabel={tab === "receivable" ? "No customer invoices yet." : "No vendor bills yet."} />
      )}

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} defaultType={tab === "receivable" ? "sale" : "purchase"} />
    </AppShell>
  );
}
