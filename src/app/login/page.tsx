"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Field } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { signIn, isDemoMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-700 text-lg font-bold text-white">L</div>
          <h1 className="text-xl font-semibold text-gray-900">Sign in to LedgerFlow</h1>
          <p className="mt-1 text-sm text-gray-500">Automated accounting for your business</p>
        </div>

        {isDemoMode && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Running in local demo mode. Create an account to explore a fully seeded business — data is stored in this browser only.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-indigo-700 hover:underline">
            Set up your business
          </Link>
        </p>
      </div>
    </div>
  );
}
