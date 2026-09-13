"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Field } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const { signUp, isDemoMode } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUp(email, password, businessName, displayName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--brand-light)] via-white to-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg brand-gradient text-lg font-bold text-white shadow-md">L</div>
          <h1 className="text-xl font-semibold text-gray-900">Create your LedgerFlow account</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Set up double-entry accounting automation in minutes</p>
        </div>

        {isDemoMode && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Local demo mode: we&apos;ll seed your new business with ~60 days of realistic sales, purchases, expenses, and invoices so every screen has real data instantly.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Field label="Your name">
            <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Founder" />
          </Field>
          <Field label="Business name">
            <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Aurora Coffee Roasters" />
          </Field>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <Field label="Password" hint="At least 6 characters">
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating your business…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
