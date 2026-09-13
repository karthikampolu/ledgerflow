"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { db } from "@/lib/data";
import { UploadCloud } from "lucide-react";

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
}

/** Normalize common bank CSV export formats: Date, Description, Amount (or Debit/Credit columns). */
function normalizeRows(raw: Record<string, string>[]): ParsedRow[] {
  return raw
    .map((row) => {
      const keys = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
        acc[k.trim().toLowerCase()] = row[k];
        return acc;
      }, {});
      const date = keys["date"] || keys["transaction date"] || keys["posted date"];
      const description = keys["description"] || keys["memo"] || keys["details"] || "";
      let amount: number | null = null;
      if (keys["amount"] !== undefined) {
        amount = parseFloat(keys["amount"]);
      } else if (keys["debit"] !== undefined || keys["credit"] !== undefined) {
        const debit = parseFloat(keys["debit"] || "0") || 0;
        const credit = parseFloat(keys["credit"] || "0") || 0;
        amount = credit - debit;
      }
      if (!date || amount === null || isNaN(amount)) return null;
      const isoDate = normalizeDate(date);
      return { date: isoDate, description, amount };
    })
    .filter((r): r is ParsedRow => r !== null);
}

function normalizeDate(input: string): string {
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return trimmed;
}

export function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { authUser, business } = useAuth();
  const { refreshAll } = useBusinessData();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const normalized = normalizeRows(results.data);
        if (normalized.length === 0) setError("Couldn't find recognizable Date/Description/Amount columns in this file.");
        setRows(normalized);
      },
      error: (err) => setError(err.message),
    });
  }

  async function handleImport() {
    if (!authUser || !business || rows.length === 0) return;
    setBusy(true);
    try {
      await db.importBankTransactionsCsv(business.id, rows, authUser);
      await refreshAll();
      onClose();
      setRows([]);
      setFileName("");
    } finally {
      setBusy(false);
    }
  }

  function loadSampleCsv() {
    const sample = `Date,Description,Amount
${new Date().toISOString().slice(0, 10)},MONTHLY SERVICE FEE,-15.00
${new Date().toISOString().slice(0, 10)},CHECK DEPOSIT,540.00`;
    const blob = new File([sample], "sample-bank-feed.csv", { type: "text/csv" });
    handleFile(blob);
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Bank Transactions (CSV)" wide>
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-indigo-400">
          <UploadCloud className="text-gray-400" size={28} />
          <span className="text-sm font-medium text-gray-700">{fileName || "Click to choose a CSV file"}</span>
          <span className="text-xs text-gray-400">Expected columns: Date, Description, Amount (or Debit/Credit)</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        <button onClick={loadSampleCsv} className="text-xs font-medium text-indigo-700 hover:underline">
          Use a sample CSV instead
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {rows.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{r.date}</td>
                    <td className="px-3 py-1.5">{r.description}</td>
                    <td className={`px-3 py-1.5 text-right num ${r.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{r.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={busy || rows.length === 0}>
            {busy ? "Importing…" : `Import ${rows.length || ""} Transactions`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
