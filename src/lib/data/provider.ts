import {
  Account,
  AppUser,
  AuditAction,
  AuditLogEntry,
  BankTransaction,
  Business,
  Invoice,
  InvoiceKind,
  JournalEntry,
  Transaction,
  TransactionInput,
} from "@/lib/types";

export interface AuthResult {
  uid: string;
  email: string;
}

/**
 * Storage-agnostic data access contract. Implemented identically by
 * FirebaseProvider (Auth + Firestore + Storage) and LocalProvider
 * (browser-local demo mode), so the rest of the app never needs to know
 * which backend is active.
 */
export interface DataProvider {
  // ---- Auth ----
  signUp(email: string, password: string, businessName: string, displayName: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOutUser(): Promise<void>;
  onAuthChange(cb: (user: AuthResult | null) => void): () => void;
  getAppUser(uid: string): Promise<AppUser | null>;

  // ---- Business ----
  getBusiness(businessId: string): Promise<Business | null>;
  updateBusiness(businessId: string, patch: Partial<Business>): Promise<void>;

  // ---- Chart of Accounts ----
  listAccounts(businessId: string): Promise<Account[]>;
  createAccount(businessId: string, account: Omit<Account, "id" | "createdAt">, actor: AuthResult): Promise<Account>;
  updateAccount(businessId: string, accountId: string, patch: Partial<Account>, actor: AuthResult): Promise<void>;
  archiveAccount(businessId: string, accountId: string, actor: AuthResult): Promise<void>;

  // ---- Journal Entries (General Ledger) ----
  listJournalEntries(businessId: string): Promise<JournalEntry[]>;

  // ---- Transactions ----
  listTransactions(businessId: string): Promise<Transaction[]>;
  recordTransaction(businessId: string, input: TransactionInput, actor: AuthResult): Promise<Transaction>;

  // ---- Invoices ----
  listInvoices(businessId: string): Promise<Invoice[]>;
  createInvoiceFromTransaction(businessId: string, transaction: Transaction, kind: InvoiceKind, dueDate: string, actor: AuthResult): Promise<Invoice>;
  recordInvoicePayment(businessId: string, invoiceId: string, amount: number, date: string, paymentMethod: "cash" | "bank", actor: AuthResult): Promise<void>;

  // ---- Bank ----
  listBankTransactions(businessId: string): Promise<BankTransaction[]>;
  importBankTransactionsCsv(
    businessId: string,
    rows: { date: string; description: string; amount: number }[],
    actor: AuthResult
  ): Promise<BankTransaction[]>;
  matchBankTransaction(businessId: string, bankTransactionId: string, transactionId: string, actor: AuthResult): Promise<void>;
  ignoreBankTransaction(businessId: string, bankTransactionId: string, actor: AuthResult): Promise<void>;

  // ---- Documents ----
  uploadDocument(businessId: string, file: File, path: string): Promise<string>;

  // ---- Audit ----
  listAuditLog(businessId: string): Promise<AuditLogEntry[]>;
  logAudit(businessId: string, entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void>;
}

export function auditAction(action: AuditAction): AuditAction {
  return action;
}
