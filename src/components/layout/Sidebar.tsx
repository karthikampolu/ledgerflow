"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Inbox,
  Send,
  BookOpen,
  Landmark,
  BarChart3,
  ShieldCheck,
  Settings,
  BookOpenCheck,
} from "lucide-react";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/invoices", label: "Invoices & Bills", icon: FileText },
  { href: "/receivables", label: "Receivables", icon: Inbox },
  { href: "/payables", label: "Payables", icon: Send },
  { href: "/accounts", label: "Chart of Accounts", icon: BookOpen },
  { href: "/ledger", label: "General Ledger", icon: BookOpenCheck },
  { href: "/bank", label: "Bank & Reconciliation", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit Trail", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-700 text-sm font-bold text-white">L</div>
        <span className="text-base font-semibold tracking-tight text-gray-900">LedgerFlow</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export const NAV_ITEMS = NAV;
