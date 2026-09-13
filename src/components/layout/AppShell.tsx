"use client";

import { ReactNode } from "react";
import { Topbar } from "@/components/layout/Topbar";

/**
 * Presentational page chrome (top bar + scrollable content area). The auth
 * guard and BusinessDataProvider live one level up, in the (app) route
 * group layout, so pages using this component are guaranteed to already be
 * inside that provider.
 */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Topbar title={title} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </>
  );
}
