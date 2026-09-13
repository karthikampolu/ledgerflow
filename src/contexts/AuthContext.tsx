"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { db } from "@/lib/data";
import { AuthResult } from "@/lib/data/provider";
import { AppUser, Business } from "@/lib/types";
import { isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  loading: boolean;
  authUser: AuthResult | null;
  appUser: AppUser | null;
  business: Business | null;
  isDemoMode: boolean;
  refreshBusiness: () => Promise<void>;
  signUp: (email: string, password: string, businessName: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthResult | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const loadUserAndBusiness = useCallback(async (auth: AuthResult | null) => {
    if (!auth) {
      setAppUser(null);
      setBusiness(null);
      return;
    }
    const user = await db.getAppUser(auth.uid);
    setAppUser(user);
    if (user?.businessId) {
      const biz = await db.getBusiness(user.businessId);
      setBusiness(biz);
    } else {
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    const unsub = db.onAuthChange(async (user) => {
      setAuthUser(user);
      await loadUserAndBusiness(user);
      setLoading(false);
    });
    return unsub;
  }, [loadUserAndBusiness]);

  const refreshBusiness = useCallback(async () => {
    await loadUserAndBusiness(authUser);
  }, [authUser, loadUserAndBusiness]);

  const signUp = useCallback(async (email: string, password: string, businessName: string, displayName: string) => {
    const result = await db.signUp(email, password, businessName, displayName);
    setAuthUser(result);
    await loadUserAndBusiness(result);
  }, [loadUserAndBusiness]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await db.signIn(email, password);
    setAuthUser(result);
    await loadUserAndBusiness(result);
  }, [loadUserAndBusiness]);

  const signOutUser = useCallback(async () => {
    await db.signOutUser();
    setAuthUser(null);
    setAppUser(null);
    setBusiness(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      authUser,
      appUser,
      business,
      isDemoMode: !isFirebaseConfigured,
      refreshBusiness,
      signUp,
      signIn,
      signOutUser,
    }),
    [loading, authUser, appUser, business, refreshBusiness, signUp, signIn, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
