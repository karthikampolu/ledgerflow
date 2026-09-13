"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { loading, authUser, appUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authUser) router.replace("/login");
    else if (appUser && !appUser.businessId) router.replace("/onboarding");
    else router.replace("/dashboard");
  }, [loading, authUser, appUser, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
    </div>
  );
}
