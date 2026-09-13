"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/data";
import { Account, AuditLogEntry, BankTransaction, Invoice, JournalEntry, Transaction } from "@/lib/types";

interface BusinessDataContextValue {
  loading: boolean;
  accounts: Account[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  bankTransactions: BankTransaction[];
  auditLog: AuditLogEntry[];
  refreshAll: () => Promise<void>;
}

const BusinessDataContext = createContext<BusinessDataContextValue | undefined>(undefined);

export function BusinessDataProvider({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const refreshAll = useCallback(async () => {
    if (!business) {
      setAccounts([]);
      setTransactions([]);
      setJournalEntries([]);
      setInvoices([]);
      setBankTransactions([]);
      setAuditLog([]);
      return;
    }
    setLoading(true);
    const [acc, tx, je, inv, bank, log] = await Promise.all([
      db.listAccounts(business.id),
      db.listTransactions(business.id),
      db.listJournalEntries(business.id),
      db.listInvoices(business.id),
      db.listBankTransactions(business.id),
      db.listAuditLog(business.id),
    ]);
    setAccounts(acc);
    setTransactions(tx.sort((a, b) => b.date.localeCompare(a.date)));
    setJournalEntries(je);
    setInvoices(inv.sort((a, b) => b.issueDate.localeCompare(a.issueDate)));
    setBankTransactions(bank.sort((a, b) => b.date.localeCompare(a.date)));
    setAuditLog(log);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data load whenever the active business changes
    refreshAll();
  }, [refreshAll]);

  const value = useMemo<BusinessDataContextValue>(
    () => ({ loading, accounts, transactions, journalEntries, invoices, bankTransactions, auditLog, refreshAll }),
    [loading, accounts, transactions, journalEntries, invoices, bankTransactions, auditLog, refreshAll]
  );

  return <BusinessDataContext.Provider value={value}>{children}</BusinessDataContext.Provider>;
}

export function useBusinessData(): BusinessDataContextValue {
  const ctx = useContext(BusinessDataContext);
  if (!ctx) throw new Error("useBusinessData must be used within BusinessDataProvider");
  return ctx;
}
