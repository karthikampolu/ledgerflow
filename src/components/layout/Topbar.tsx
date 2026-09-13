"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_ITEMS } from "@/components/layout/Sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

export function Topbar({ title }: { title: string }) {
  const { appUser, business, signOutUser, isDemoMode } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen((v) => !v)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          {business && <p className="text-xs text-gray-500">{business.name}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isDemoMode && (
          <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:inline-block">
            Local demo mode
          </span>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <UserIcon size={13} />
          </div>
          <span className="hidden text-xs font-medium text-gray-700 sm:inline">{appUser?.displayName || appUser?.email}</span>
        </div>
        <button
          onClick={async () => {
            await signOutUser();
            router.push("/login");
          }}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
          title="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 top-16 z-40 w-64 border-r border-b border-gray-200 bg-white shadow-lg lg:hidden">
          <nav className="space-y-0.5 p-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
