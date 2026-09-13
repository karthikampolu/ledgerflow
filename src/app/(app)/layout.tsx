"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessDataProvider } from "@/contexts/BusinessDataContext";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Shared layout for every authenticated route. Owns the auth guard and the
 * BusinessDataProvider so that all pages rendered as `children` here are
 * true descendants of the provider and can safely call useBusinessData().
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { loading, authUser, appUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authUser) router.replace("/login");
    else if (!loading && authUser && appUser && !appUser.businessId) router.replace("/onboarding");
  }, [loading, authUser, appUser, router]);

  if (loading || !authUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  return (
    <BusinessDataProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </BusinessDataProvider>
  );
}
