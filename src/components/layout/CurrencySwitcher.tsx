"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/data";
import { cx } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

/** Compact, always-visible currency switcher in the top bar — changes take effect app-wide immediately. */
export function CurrencySwitcher() {
  const { business, refreshBusiness } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!business) return null;
  const current = CURRENCIES.find((c) => c.code === business.currency) || { code: business.currency, symbol: "", label: business.currency };

  async function selectCurrency(code: string) {
    if (!business || code === business.currency) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await db.updateBusiness(business.id, { currency: code });
      await refreshBusiness();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={cx(
          "flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50",
          open && "border-[var(--brand)] ring-2 ring-[var(--brand-light)]"
        )}
        title="Change display currency"
      >
        <span className="text-[var(--brand)]">{current.symbol}</span>
        <span>{current.code}</span>
        <ChevronDown size={13} className="text-gray-400" />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 card-shadow">
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Display Currency</p>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => selectCurrency(c.code)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-[var(--brand-light)] hover:text-[var(--brand-dark)]"
            >
              <span className="flex items-center gap-2">
                <span className="w-4 text-center font-semibold text-gray-500">{c.symbol}</span>
                <span>{c.label}</span>
              </span>
              {c.code === current.code && <Check size={14} className="text-[var(--brand)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
