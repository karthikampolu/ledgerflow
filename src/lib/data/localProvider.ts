"use client";

import { v4 as uuid } from "uuid";
import { DataProvider, AuthResult } from "@/lib/data/provider";
import {
  Account,
  AppUser,
  AuditLogEntry,
  BankTransaction,
  Business,
  Invoice,
  InvoiceKind,
  JournalEntry,
  Transaction,
  TransactionInput,
} from "@/lib/types";
import { generateJournalLines } from "@/lib/accounting/rules";
import { validateBalanced, nextSequenceNumber } from "@/lib/accounting/ledger";
import { buildDemoDataset } from "@/lib/demoData";

interface LocalUserRecord {
  uid: string;
  email: string;
  password: string; // demo-mode only, plain text, browser-local storage
  displayName: string;
  businessId?: string;
}

const KEYS = {
  users: "ledgerflow_users",
  session: "ledgerflow_session",
  business: (id: string) => `ledgerflow_business_${id}`,
  accounts: (id: string) => `ledgerflow_accounts_${id}`,
  transactions: (id: string) => `ledgerflow_transactions_${id}`,
  journalEntries: (id: string) => `ledgerflow_journal_entries_${id}`,
  invoices: (id: string) => `ledgerflow_invoices_${id}`,
  bankTransactions: (id: string) => `ledgerflow_bank_transactions_${id}`,
  auditLog: (id: string) => `ledgerflow_audit_log_${id}`,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

type AuthListener = (user: AuthResult | null) => void;
const listeners = new Set<AuthListener>();

function notifyAuthChange(user: AuthResult | null) {
  listeners.forEach((cb) => cb(user));
}

function getUsers(): LocalUserRecord[] {
  return read<LocalUserRecord[]>(KEYS.users, []);
}

function saveUsers(users: LocalUserRecord[]) {
  write(KEYS.users, users);
}

export class LocalProvider implements DataProvider {
  async signUp(email: string, password: string, businessName: string, displayName: string): Promise<AuthResult> {
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const uid = uuid();
    const businessId = "demo-business";

    // Seed a full realistic demo dataset for this new business so every
    // screen has real, working data from the moment of signup.
    const dataset = buildDemoDataset(uid, email, businessName);
    write(KEYS.business(businessId), dataset.business);
    write(KEYS.accounts(businessId), dataset.accounts);
    write(KEYS.transactions(businessId), dataset.transactions);
    write(KEYS.journalEntries(businessId), dataset.journalEntries);
    write(KEYS.invoices(businessId), dataset.invoices);
    write(KEYS.bankTransactions(businessId), dataset.bankTransactions);
    write(KEYS.auditLog(businessId), dataset.auditLog);

    const record: LocalUserRecord = { uid, email, password, displayName, businessId };
    users.push(record);
    saveUsers(users);

    const session: AuthResult = { uid, email };
    write(KEYS.session, session);
    notifyAuthChange(session);
    return session;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password.");
    }
    const session: AuthResult = { uid: user.uid, email: user.email };
    write(KEYS.session, session);
    notifyAuthChange(session);
    return session;
  }

  async signOutUser(): Promise<void> {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEYS.session);
    notifyAuthChange(null);
  }

  onAuthChange(cb: AuthListener): () => void {
    listeners.add(cb);
    // Emit current session immediately.
    const session = read<AuthResult | null>(KEYS.session, null);
    cb(session);
    return () => listeners.delete(cb);
  }

  async getAppUser(uid: string): Promise<AppUser | null> {
    const user = getUsers().find((u) => u.uid === uid);
    if (!user) return null;
    return { uid: user.uid, email: user.email, displayName: user.displayName, businessId: user.businessId };
  }

  async getBusiness(businessId: string): Promise<Business | null> {
    return read<Business | null>(KEYS.business(businessId), null);
  }

  async updateBusiness(businessId: string, patch: Partial<Business>): Promise<void> {
    const business = await this.getBusiness(businessId);
    if (!business) return;
    write(KEYS.business(businessId), { ...business, ...patch });
  }

  async listAccounts(businessId: string): Promise<Account[]> {
    return read<Account[]>(KEYS.accounts(businessId), []);
  }

  async createAccount(businessId: string, account: Omit<Account, "id" | "createdAt">, actor: AuthResult): Promise<Account> {
    const accounts = await this.listAccounts(businessId);
    const newAccount: Account = { ...account, id: uuid(), createdAt: new Date().toISOString() };
    accounts.push(newAccount);
    write(KEYS.accounts(businessId), accounts);
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "create",
      entityType: "account",
      entityId: newAccount.id,
      summary: `Created account ${newAccount.code} - ${newAccount.name}`,
    });
    return newAccount;
  }

  async updateAccount(businessId: string, accountId: string, patch: Partial<Account>, actor: AuthResult): Promise<void> {
    const accounts = await this.listAccounts(businessId);
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) return;
    accounts[idx] = { ...accounts[idx], ...patch };
    write(KEYS.accounts(businessId), accounts);
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "update",
      entityType: "account",
      entityId: accountId,
      summary: `Updated account ${accounts[idx].code} - ${accounts[idx].name}`,
    });
  }

  async archiveAccount(businessId: string, accountId: string, actor: AuthResult): Promise<void> {
    await this.updateAccount(businessId, accountId, { archived: true }, actor);
  }

  async listJournalEntries(businessId: string): Promise<JournalEntry[]> {
    return read<JournalEntry[]>(KEYS.journalEntries(businessId), []);
  }

  async listTransactions(businessId: string): Promise<Transaction[]> {
    return read<Transaction[]>(KEYS.transactions(businessId), []);
  }

  async recordTransaction(businessId: string, input: TransactionInput, actor: AuthResult): Promise<Transaction> {
    const accounts = await this.listAccounts(businessId);
    const lines = generateJournalLines(input, accounts);
    const { debit } = validateBalanced(lines);
    const journalEntries = await this.listJournalEntries(businessId);

    const je: JournalEntry = {
      id: uuid(),
      businessId,
      date: input.date,
      reference: nextSequenceNumber(journalEntries, "JE"),
      description: `${capitalize(input.type)} - ${input.partyName}`,
      sourceType: input.type,
      lines,
      totalDebit: debit,
      totalCredit: debit,
      createdAt: new Date().toISOString(),
      createdBy: actor.uid,
    };
    journalEntries.push(je);
    write(KEYS.journalEntries(businessId), journalEntries);

    const taxAmount = round2((input.amount * (input.taxRate || 0)) / 100);
    const transactions = await this.listTransactions(businessId);
    const tx: Transaction = {
      id: uuid(),
      businessId,
      type: input.type,
      date: input.date,
      paymentMethod: input.paymentMethod,
      amount: round2(input.amount),
      taxRate: input.taxRate || 0,
      taxAmount,
      totalAmount: round2(input.amount + taxAmount),
      partyName: input.partyName,
      category: input.category,
      memo: input.memo,
      accountId: input.accountId,
      invoiceId: input.invoiceId,
      journalEntryId: je.id,
      createdAt: je.createdAt,
      createdBy: actor.uid,
    };
    transactions.push(tx);
    write(KEYS.transactions(businessId), transactions);

    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "create",
      entityType: "transaction",
      entityId: tx.id,
      summary: `Recorded ${tx.type} of $${tx.totalAmount.toFixed(2)} - ${tx.partyName}`,
    });
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "post_journal_entry",
      entityType: "journalEntry",
      entityId: je.id,
      summary: `Posted ${je.reference}: ${je.description} ($${je.totalDebit.toFixed(2)})`,
    });

    return tx;
  }

  async listInvoices(businessId: string): Promise<Invoice[]> {
    return read<Invoice[]>(KEYS.invoices(businessId), []);
  }

  async createInvoiceFromTransaction(businessId: string, transaction: Transaction, kind: InvoiceKind, dueDate: string, actor: AuthResult): Promise<Invoice> {
    const invoices = await this.listInvoices(businessId);
    const prefix = kind === "receivable" ? "INV" : "BILL";
    const number = nextSequenceNumber(invoices.filter((i) => i.kind === kind).map((i) => ({ reference: i.number })), prefix);
    // A transaction generated retroactively (e.g. via "Generate Invoice" on
    // an already-recorded Cash/Bank transaction) was settled at the time it
    // was posted — the resulting document must reflect that as already
    // paid, not as an outstanding balance the customer/vendor still owes.
    const alreadySettled = transaction.paymentMethod !== "credit";
    const invoice: Invoice = {
      id: uuid(),
      businessId,
      kind,
      number,
      partyName: transaction.partyName,
      issueDate: transaction.date,
      dueDate,
      lineItems: [{ description: transaction.memo || transaction.type, quantity: 1, unitPrice: transaction.amount, amount: transaction.amount }],
      subtotal: transaction.amount,
      taxRate: transaction.taxRate,
      taxAmount: transaction.taxAmount,
      total: transaction.totalAmount,
      amountPaid: alreadySettled ? transaction.totalAmount : 0,
      status: alreadySettled ? "paid" : "sent",
      sourceTransactionId: transaction.id,
      createdAt: new Date().toISOString(),
      createdBy: actor.uid,
    };
    invoices.push(invoice);
    write(KEYS.invoices(businessId), invoices);

    const transactions = await this.listTransactions(businessId);
    const idx = transactions.findIndex((t) => t.id === transaction.id);
    if (idx !== -1) {
      transactions[idx] = { ...transactions[idx], invoiceId: invoice.id };
      write(KEYS.transactions(businessId), transactions);
    }

    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "create",
      entityType: "invoice",
      entityId: invoice.id,
      summary: `Generated invoice ${invoice.number} for ${invoice.partyName}`,
    });
    return invoice;
  }

  async recordInvoicePayment(businessId: string, invoiceId: string, amount: number, date: string, paymentMethod: "cash" | "bank", actor: AuthResult): Promise<void> {
    const invoices = await this.listInvoices(businessId);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) throw new Error("Invoice not found");
    const invoice = invoices[idx];

    const txInput: TransactionInput = {
      type: invoice.kind === "receivable" ? "receipt" : "payment",
      date,
      paymentMethod,
      amount,
      taxRate: 0,
      partyName: invoice.partyName,
      memo: `Payment for ${invoice.kind === "receivable" ? "invoice" : "bill"} ${invoice.number}`,
      invoiceId: invoice.id,
    };
    await this.recordTransaction(businessId, txInput, actor);

    const newAmountPaid = round2(invoice.amountPaid + amount);
    invoice.amountPaid = newAmountPaid;
    invoice.status = newAmountPaid >= invoice.total - 0.01 ? "paid" : "partially_paid";
    invoices[idx] = invoice;
    write(KEYS.invoices(businessId), invoices);

    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "record_payment",
      entityType: "invoice",
      entityId: invoice.id,
      summary: `Recorded payment of $${amount.toFixed(2)} for ${invoice.number}`,
    });
  }

  async listBankTransactions(businessId: string): Promise<BankTransaction[]> {
    return read<BankTransaction[]>(KEYS.bankTransactions(businessId), []);
  }

  async importBankTransactionsCsv(businessId: string, rows: { date: string; description: string; amount: number }[], actor: AuthResult): Promise<BankTransaction[]> {
    const existing = await this.listBankTransactions(businessId);
    const importBatchId = uuid();
    const imported: BankTransaction[] = rows.map((r) => ({
      id: uuid(),
      businessId,
      date: r.date,
      description: r.description,
      amount: r.amount,
      status: "unmatched",
      importBatchId,
      createdAt: new Date().toISOString(),
    }));
    const merged = [...existing, ...imported];
    write(KEYS.bankTransactions(businessId), merged);

    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "import_bank_csv",
      entityType: "bankTransactions",
      entityId: importBatchId,
      summary: `Imported ${imported.length} bank transactions from CSV`,
    });
    return imported;
  }

  async matchBankTransaction(businessId: string, bankTransactionId: string, transactionId: string, actor: AuthResult): Promise<void> {
    const bankTx = await this.listBankTransactions(businessId);
    const idx = bankTx.findIndex((b) => b.id === bankTransactionId);
    if (idx === -1) return;
    bankTx[idx] = { ...bankTx[idx], matchedTransactionId: transactionId, status: "matched" };
    write(KEYS.bankTransactions(businessId), bankTx);
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "reconcile",
      entityType: "bankTransaction",
      entityId: bankTransactionId,
      summary: `Reconciled bank transaction with recorded transaction`,
    });
  }

  async ignoreBankTransaction(businessId: string, bankTransactionId: string, actor: AuthResult): Promise<void> {
    const bankTx = await this.listBankTransactions(businessId);
    const idx = bankTx.findIndex((b) => b.id === bankTransactionId);
    if (idx === -1) return;
    bankTx[idx] = { ...bankTx[idx], status: "ignored" };
    write(KEYS.bankTransactions(businessId), bankTx);
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "update",
      entityType: "bankTransaction",
      entityId: bankTransactionId,
      summary: `Marked bank transaction as ignored`,
    });
  }

  async listAuditLog(businessId: string): Promise<AuditLogEntry[]> {
    return read<AuditLogEntry[]>(KEYS.auditLog(businessId), []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async logAudit(businessId: string, entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    const log = read<AuditLogEntry[]>(KEYS.auditLog(businessId), []);
    log.push({ ...entry, id: uuid(), timestamp: new Date().toISOString() });
    write(KEYS.auditLog(businessId), log);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const localProvider = new LocalProvider();
