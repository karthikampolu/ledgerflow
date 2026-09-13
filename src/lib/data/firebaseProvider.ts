import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { auth, firestore } from "@/lib/firebase";
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
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounting/chartOfAccounts";
import { generateJournalLines } from "@/lib/accounting/rules";
import { validateBalanced, nextSequenceNumber } from "@/lib/accounting/ledger";

function requireDb() {
  if (!firestore) throw new Error("Firestore is not configured.");
  return firestore;
}
function requireAuth() {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  return auth;
}

function businessSub(businessId: string, sub: string) {
  return collection(requireDb(), "businesses", businessId, sub);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Firestore rejects any field whose value is `undefined` (it must be
 * omitted entirely, or explicitly deleted). Our domain types use
 * `field?: string` for optional data, which in plain JS objects becomes
 * `field: undefined` rather than an absent key — so every value written
 * to Firestore is recursively cleaned of `undefined` first.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export class FirebaseProvider implements DataProvider {
  async signUp(email: string, password: string, businessName: string, displayName: string): Promise<AuthResult> {
    const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
    if (displayName) await updateProfile(cred.user, { displayName });

    const businessId = uuid();
    const business: Business = {
      id: businessId,
      ownerUid: cred.user.uid,
      name: businessName || "My Business",
      industry: "General",
      currency: "USD",
      fiscalYearStartMonth: 1,
      taxRateDefault: 8,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(requireDb(), "businesses", businessId), stripUndefined(business));

    const batch = writeBatch(requireDb());
    for (const seed of DEFAULT_CHART_OF_ACCOUNTS) {
      const account: Account = {
        id: uuid(),
        code: seed.code,
        name: seed.name,
        type: seed.type,
        subtype: seed.subtype,
        description: seed.description,
        isSystem: true,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(businessSub(businessId, "accounts"), account.id), stripUndefined(account));
    }
    await batch.commit();

    await setDoc(
      doc(requireDb(), "users", cred.user.uid),
      stripUndefined({
        uid: cred.user.uid,
        email,
        displayName: displayName || email,
        businessId,
      })
    );

    return { uid: cred.user.uid, email };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
    return { uid: cred.user.uid, email: cred.user.email || email };
  }

  async signOutUser(): Promise<void> {
    await signOut(requireAuth());
  }

  onAuthChange(cb: (user: AuthResult | null) => void): () => void {
    return onAuthStateChanged(requireAuth(), (user) => {
      cb(user ? { uid: user.uid, email: user.email || "" } : null);
    });
  }

  async getAppUser(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(requireDb(), "users", uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  }

  async getBusiness(businessId: string): Promise<Business | null> {
    const snap = await getDoc(doc(requireDb(), "businesses", businessId));
    return snap.exists() ? (snap.data() as Business) : null;
  }

  async updateBusiness(businessId: string, patch: Partial<Business>): Promise<void> {
    await updateDoc(doc(requireDb(), "businesses", businessId), stripUndefined(patch));
  }

  async listAccounts(businessId: string): Promise<Account[]> {
    const snap = await getDocs(businessSub(businessId, "accounts"));
    return snap.docs.map((d) => d.data() as Account).sort((a, b) => a.code.localeCompare(b.code));
  }

  async createAccount(businessId: string, account: Omit<Account, "id" | "createdAt">, actor: AuthResult): Promise<Account> {
    const newAccount: Account = { ...account, id: uuid(), createdAt: new Date().toISOString() };
    await setDoc(doc(businessSub(businessId, "accounts"), newAccount.id), stripUndefined(newAccount));
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
    await updateDoc(doc(businessSub(businessId, "accounts"), accountId), stripUndefined(patch));
    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "update",
      entityType: "account",
      entityId: accountId,
      summary: `Updated account ${accountId}`,
    });
  }

  async archiveAccount(businessId: string, accountId: string, actor: AuthResult): Promise<void> {
    await this.updateAccount(businessId, accountId, { archived: true }, actor);
  }

  async listJournalEntries(businessId: string): Promise<JournalEntry[]> {
    const snap = await getDocs(query(businessSub(businessId, "journalEntries"), orderBy("date")));
    return snap.docs.map((d) => d.data() as JournalEntry);
  }

  async listTransactions(businessId: string): Promise<Transaction[]> {
    const snap = await getDocs(query(businessSub(businessId, "transactions"), orderBy("date", "desc")));
    return snap.docs.map((d) => d.data() as Transaction);
  }

  async recordTransaction(businessId: string, input: TransactionInput, actor: AuthResult): Promise<Transaction> {
    const accounts = await this.listAccounts(businessId);
    const lines = generateJournalLines(input, accounts);
    const { debit } = validateBalanced(lines);
    const existingEntries = await this.listJournalEntries(businessId);

    const je: JournalEntry = {
      id: uuid(),
      businessId,
      date: input.date,
      reference: nextSequenceNumber(existingEntries, "JE"),
      description: `${capitalize(input.type)} - ${input.partyName}`,
      sourceType: input.type,
      lines,
      totalDebit: debit,
      totalCredit: debit,
      createdAt: new Date().toISOString(),
      createdBy: actor.uid,
    };
    await setDoc(doc(businessSub(businessId, "journalEntries"), je.id), stripUndefined(je));

    const taxAmount = round2((input.amount * (input.taxRate || 0)) / 100);
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
    await setDoc(doc(businessSub(businessId, "transactions"), tx.id), stripUndefined(tx));

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
    const snap = await getDocs(query(businessSub(businessId, "invoices"), orderBy("issueDate", "desc")));
    return snap.docs.map((d) => d.data() as Invoice);
  }

  async createInvoiceFromTransaction(businessId: string, transaction: Transaction, kind: InvoiceKind, dueDate: string, actor: AuthResult): Promise<Invoice> {
    const invoices = await this.listInvoices(businessId);
    const prefix = kind === "receivable" ? "INV" : "BILL";
    const number = nextSequenceNumber(invoices.filter((i) => i.kind === kind).map((i) => ({ reference: i.number })), prefix);
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
      amountPaid: 0,
      status: "sent",
      sourceTransactionId: transaction.id,
      createdAt: new Date().toISOString(),
      createdBy: actor.uid,
    };
    await setDoc(doc(businessSub(businessId, "invoices"), invoice.id), stripUndefined(invoice));
    await updateDoc(doc(businessSub(businessId, "transactions"), transaction.id), { invoiceId: invoice.id });

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
    const snap = await getDoc(doc(businessSub(businessId, "invoices"), invoiceId));
    if (!snap.exists()) throw new Error("Invoice not found");
    const invoice = snap.data() as Invoice;

    await this.recordTransaction(
      businessId,
      {
        type: invoice.kind === "receivable" ? "receipt" : "payment",
        date,
        paymentMethod,
        amount,
        taxRate: 0,
        partyName: invoice.partyName,
        memo: `Payment for ${invoice.kind === "receivable" ? "invoice" : "bill"} ${invoice.number}`,
        invoiceId: invoice.id,
      },
      actor
    );

    const newAmountPaid = round2(invoice.amountPaid + amount);
    const status = newAmountPaid >= invoice.total - 0.01 ? "paid" : "partially_paid";
    await updateDoc(doc(businessSub(businessId, "invoices"), invoiceId), { amountPaid: newAmountPaid, status });

    await this.logAudit(businessId, {
      businessId,
      uid: actor.uid,
      userEmail: actor.email,
      action: "record_payment",
      entityType: "invoice",
      entityId: invoiceId,
      summary: `Recorded payment of $${amount.toFixed(2)} for ${invoice.number}`,
    });
  }

  async listBankTransactions(businessId: string): Promise<BankTransaction[]> {
    const snap = await getDocs(query(businessSub(businessId, "bankTransactions"), orderBy("date", "desc")));
    return snap.docs.map((d) => d.data() as BankTransaction);
  }

  async importBankTransactionsCsv(businessId: string, rows: { date: string; description: string; amount: number }[], actor: AuthResult): Promise<BankTransaction[]> {
    const importBatchId = uuid();
    const batch = writeBatch(requireDb());
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
    for (const bt of imported) {
      batch.set(doc(businessSub(businessId, "bankTransactions"), bt.id), stripUndefined(bt));
    }
    await batch.commit();

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
    await updateDoc(doc(businessSub(businessId, "bankTransactions"), bankTransactionId), {
      matchedTransactionId: transactionId,
      status: "matched",
    });
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
    await updateDoc(doc(businessSub(businessId, "bankTransactions"), bankTransactionId), { status: "ignored" });
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
    const snap = await getDocs(query(businessSub(businessId, "auditLog"), orderBy("timestamp", "desc")));
    return snap.docs.map((d) => d.data() as AuditLogEntry);
  }

  async logAudit(businessId: string, entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    const id = uuid();
    await setDoc(
      doc(businessSub(businessId, "auditLog"), id),
      stripUndefined({
        ...entry,
        id,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

export const firebaseProvider = new FirebaseProvider();
