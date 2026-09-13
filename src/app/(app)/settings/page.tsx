"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/data";

export default function SettingsPage() {
  const { business, appUser, isDemoMode, refreshBusiness } = useAuth();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxRateDefault, setTaxRateDefault] = useState("8");
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState("1");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the form from the loaded business record
    setName(business.name);
    setIndustry(business.industry);
    setCurrency(business.currency);
    setTaxRateDefault(String(business.taxRateDefault));
    setFiscalYearStartMonth(String(business.fiscalYearStartMonth));
  }, [business]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!business) return;
    setBusy(true);
    try {
      await db.updateBusiness(business.id, {
        name,
        industry,
        currency,
        taxRateDefault: parseFloat(taxRateDefault) || 0,
        fiscalYearStartMonth: parseInt(fiscalYearStartMonth, 10) || 1,
      });
      await refreshBusiness();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader title="Business Profile" subtitle="Used across invoices, reports, and the dashboard" />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Business Name">
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Industry">
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </Field>
                <Field label="Currency">
                  <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Default Sales Tax Rate (%)">
                  <Input type="number" min="0" step="0.1" value={taxRateDefault} onChange={(e) => setTaxRateDefault(e.target.value)} />
                </Field>
                <Field label="Fiscal Year Start Month">
                  <Select value={fiscalYearStartMonth} onChange={(e) => setFiscalYearStartMonth(e.target.value)}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save Changes"}
                </Button>
                {saved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardBody className="space-y-2 text-sm text-gray-600">
            <p><span className="text-gray-400">Signed in as:</span> {appUser?.email}</p>
            <p><span className="text-gray-400">Data mode:</span> {isDemoMode ? "Local demo mode (browser storage)" : "Firebase (cloud)"}</p>
            {isDemoMode && (
              <p className="text-xs text-gray-400">
                Connect a real Firebase project by setting the NEXT_PUBLIC_FIREBASE_* environment variables (see .env.local.example) to move to production data.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
