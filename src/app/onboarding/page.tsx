"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Field, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/data";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounting/chartOfAccounts";
import { Business } from "@/lib/types";
import { v4 as uuid } from "uuid";

/**
 * Fallback business setup screen for an authenticated user with no
 * business yet attached to their account (normally business creation
 * happens as part of sign-up, so this route is a safety net).
 */
export default function OnboardingPage() {
  const { authUser, refreshBusiness } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("General");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUser) return;
    setBusy(true);
    setError(null);
    try {
      const businessId = uuid();
      const business: Business = {
        id: businessId,
        ownerUid: authUser.uid,
        name,
        industry,
        currency,
        fiscalYearStartMonth: 1,
        taxRateDefault: 8,
        createdAt: new Date().toISOString(),
      };
      await db.updateBusiness(businessId, business);
      for (const seed of DEFAULT_CHART_OF_ACCOUNTS) {
        await db.createAccount(businessId, { ...seed, isSystem: true }, authUser);
      }
      await refreshBusiness();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Set up your business</h1>
        <p className="mt-1 text-sm text-gray-500">We&apos;ll create a standard Chart of Accounts automatically.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <Field label="Business name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
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
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Setting up…" : "Create business"}
          </Button>
        </form>
      </div>
    </div>
  );
}
