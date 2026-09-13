// Core domain types for LedgerFlow
// No AI/OCR. Pure structured accounting data model.

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type AccountSubtype =
  | "current_asset"
  | "fixed_asset"
  | "current_liability"
  | "long_term_liability"
  | "equity"
  | "operating_revenue"
  | "other_revenue"
  | "cogs"
  | "operating_expense"
  | "tax_expense";

export interface Account {
  id: string;
  code: string; // e.g. "1000"
  name: string; // e.g. "Cash"
  type: AccountType;
  subtype: AccountSubtype;
  description?: string;
  isSystem?: boolean; // system accounts cannot be deleted
  archived?: boolean;
  createdAt: string;
}

/** Normal balance side for each account type. */
export const NORMAL_BALANCE: Record<AccountType, "debit" | "credit"> = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  revenue: "credit",
};

export type TransactionType =
  | "sale"
  | "purchase"
  | "expense"
  | "receipt" // payment received from customer (against AR / invoice)
  | "payment"; // payment made to vendor (against AP / bill)

export type PaymentMethod = "cash" | "bank" | "credit";

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  date: string; // ISO date
  reference: string; // human readable, e.g. JE-0001
  description: string;
  sourceType: TransactionType | "opening_balance" | "adjustment";
  sourceId?: string; // id of the transaction/invoice that generated this entry
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  createdBy: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  date: string; // ISO date
  paymentMethod: PaymentMethod;
  amount: number; // pre-tax amount
  taxRate: number; // percentage, e.g. 8 for 8%
  taxAmount: number;
  totalAmount: number; // amount + taxAmount
  partyName: string; // customer or vendor name
  category?: string; // for expenses: which expense account
  memo?: string;
  accountId?: string; // override account (e.g. specific expense account, or bank account used)
  invoiceId?: string; // linked invoice, if any
  journalEntryId: string;
  createdAt: string;
  createdBy: string;
}

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void";
export type InvoiceKind = "receivable" | "payable"; // receivable = customer invoice, payable = vendor bill

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  kind: InvoiceKind;
  number: string; // e.g. INV-0001 or BILL-0001
  partyName: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  sourceTransactionId?: string;
  memo?: string;
  createdAt: string;
  createdBy: string;
}

export interface BankTransaction {
  id: string;
  businessId: string;
  date: string;
  description: string;
  amount: number; // positive = deposit, negative = withdrawal
  balance?: number;
  matchedTransactionId?: string;
  status: "unmatched" | "matched" | "ignored";
  importBatchId: string;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerUid: string;
  name: string;
  industry: string;
  currency: string; // ISO code, e.g. "USD"
  fiscalYearStartMonth: number; // 1-12
  taxRateDefault: number; // default sales tax %
  createdAt: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  businessId?: string;
}

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "post_journal_entry"
  | "reconcile"
  | "import_bank_csv"
  | "record_payment"
  | "sign_in"
  | "sign_up";

export interface AuditLogEntry {
  id: string;
  businessId: string;
  timestamp: string;
  uid: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
}

export interface TransactionInput {
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  amount: number;
  taxRate: number;
  partyName: string;
  category?: string;
  memo?: string;
  accountId?: string;
  invoiceId?: string;
}
