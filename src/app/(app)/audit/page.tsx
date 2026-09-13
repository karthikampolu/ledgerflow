"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Form";
import { formatDate } from "@/lib/utils";

const ACTION_TONE: Record<string, "gray" | "green" | "red" | "amber" | "indigo" | "blue"> = {
  create: "green",
  update: "blue",
  delete: "red",
  post_journal_entry: "indigo",
  reconcile: "indigo",
  import_bank_csv: "amber",
  record_payment: "green",
  sign_in: "gray",
  sign_up: "gray",
};

export default function AuditTrailPage() {
  const { auditLog, loading } = useBusinessData();
  const [entityFilter, setEntityFilter] = useState("all");

  const entityTypes = Array.from(new Set(auditLog.map((a) => a.entityType)));
  const filtered = entityFilter === "all" ? auditLog : auditLog.filter((a) => a.entityType === entityFilter);

  return (
    <AppShell title="Audit Trail">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} events — every create, update, and posting is recorded immutably.</p>
        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-56">
          <option value="all">All entity types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <div className="divide-y divide-gray-100">
          {loading && <p className="p-10 text-center text-sm text-gray-400">Loading…</p>}
          {!loading && filtered.length === 0 && <p className="p-10 text-center text-sm text-gray-400">No audit events yet.</p>}
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-4 px-5 py-3">
              <div className="flex items-start gap-3">
                <Badge tone={ACTION_TONE[entry.action] || "gray"} className="mt-0.5">{entry.action.replace(/_/g, " ")}</Badge>
                <div>
                  <p className="text-sm text-gray-900">{entry.summary}</p>
                  <p className="text-xs text-gray-500">{entry.userEmail} · {entry.entityType}</p>
                </div>
              </div>
              <span className="whitespace-nowrap text-xs text-gray-400">{formatDate(entry.timestamp.slice(0, 10))} {entry.timestamp.slice(11, 16)}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
