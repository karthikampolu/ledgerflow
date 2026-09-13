import { v4 as uuid } from "uuid";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounting/chartOfAccounts";
import { generateJournalLines } from "@/lib/accounting/rules";
import { validateBalanced, nextSequenceNumber } from "@/lib/accounting/ledger";
import {
  Account,
  AuditLogEntry,
  BankTransaction,
  Business,
  Invoice,
  JournalEntry,
  Transaction,
  TransactionInput,
} from "@/lib/types";
import { isoDaysAgo, isoDaysFromNow } from "@/lib/utils";

export interface DemoDataset {
  business: Business;
  accounts: Account[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  bankTransactions: BankTransaction[];
  auditLog: AuditLogEntry[];
}

interface SeedTxSpec extends Omit<TransactionInput, "date"> {
  daysAgo: number;
  makeInvoice?: boolean;
  invoiceDueDays?: number;
}

/**
 * Generates a fully realistic ~60-day operating history for a demo
 * business: sales, purchases, expenses, receipts, payments, invoices, a
 * bank feed, and the audit trail — all produced by running the same
 * accounting rules engine used for real user-entered transactions.
 */
export function buildDemoDataset(ownerUid: string, ownerEmail: string, businessName: string): DemoDataset {
  const businessId = "demo-business";

  const business: Business = {
    id: businessId,
    ownerUid,
    name: businessName || "Aurora Coffee Roasters",
    industry: "Food & Beverage",
    currency: "USD",
    fiscalYearStartMonth: 1,
    taxRateDefault: 8,
    createdAt: isoDaysAgo(90) + "T00:00:00.000Z",
  };

  const accounts: Account[] = DEFAULT_CHART_OF_ACCOUNTS.map((seed) => ({
    id: uuid(),
    code: seed.code,
    name: seed.name,
    type: seed.type,
    subtype: seed.subtype,
    description: seed.description,
    isSystem: true,
    createdAt: business.createdAt,
  }));

  const accountByCode = (code: string) => accounts.find((a) => a.code === code)!;

  const actorEmail = ownerEmail || "owner@ledgerflow.demo";

  const transactions: Transaction[] = [];
  const journalEntries: JournalEntry[] = [];
  const invoices: Invoice[] = [];
  const auditLog: AuditLogEntry[] = [];

  function pushAudit(action: AuditLogEntry["action"], entityType: string, entityId: string, summary: string, daysAgo: number) {
    auditLog.push({
      id: uuid(),
      businessId,
      timestamp: isoDaysAgo(daysAgo) + "T00:00:00.000Z",
      uid: ownerUid,
      userEmail: actorEmail,
      action,
      entityType,
      entityId,
      summary,
    });
  }

  // Opening balance: owner capital contribution to seed the bank account.
  {
    const date = isoDaysAgo(90);
    const lines = [
      { accountId: accountByCode("1010").id, accountCode: "1010", accountName: "Business Bank Account", debit: 25000, credit: 0, memo: "Opening capital contribution" },
      { accountId: accountByCode("3000").id, accountCode: "3000", accountName: "Owner's Equity", debit: 0, credit: 25000, memo: "Owner's Equity" },
    ];
    validateBalanced(lines);
    const je: JournalEntry = {
      id: uuid(),
      businessId,
      date,
      reference: "JE-0001",
      description: "Opening balance - owner capital contribution",
      sourceType: "opening_balance",
      lines,
      totalDebit: 25000,
      totalCredit: 25000,
      createdAt: date + "T00:00:00.000Z",
      createdBy: ownerUid,
    };
    journalEntries.push(je);
    pushAudit("post_journal_entry", "journalEntry", je.id, "Posted opening balance journal entry", 90);
  }

  function recordTx(spec: SeedTxSpec) {
    const date = isoDaysAgo(spec.daysAgo);
    let accountId = spec.accountId;
    if (spec.type === "expense" && !accountId) {
      accountId = accountByCode(spec.category!).id;
    }
    const input: TransactionInput = { ...spec, date, accountId };
    const lines = generateJournalLines(input, accounts);
    const { debit } = validateBalanced(lines);
    const taxAmount = Math.round(((spec.amount * (spec.taxRate || 0)) / 100 + Number.EPSILON) * 100) / 100;

    const je: JournalEntry = {
      id: uuid(),
      businessId,
      date,
      reference: nextSequenceNumber(journalEntries, "JE"),
      description: `${capitalize(spec.type)} - ${spec.partyName}`,
      sourceType: spec.type,
      lines,
      totalDebit: debit,
      totalCredit: debit,
      createdAt: date + "T00:00:00.000Z",
      createdBy: ownerUid,
    };
    journalEntries.push(je);

    const tx: Transaction = {
      id: uuid(),
      businessId,
      type: spec.type,
      date,
      paymentMethod: spec.paymentMethod,
      amount: spec.amount,
      taxRate: spec.taxRate || 0,
      taxAmount,
      totalAmount: Math.round((spec.amount + taxAmount + Number.EPSILON) * 100) / 100,
      partyName: spec.partyName,
      category: spec.category,
      memo: spec.memo,
      accountId,
      journalEntryId: je.id,
      createdAt: je.createdAt,
      createdBy: ownerUid,
    };
    transactions.push(tx);
    pushAudit("create", "transaction", tx.id, `Recorded ${spec.type} of $${tx.totalAmount.toFixed(2)} - ${spec.partyName}`, spec.daysAgo);

    if (spec.makeInvoice) {
      const kind = spec.type === "sale" ? "receivable" : "payable";
      const number = kind === "receivable" ? nextSequenceNumber(invoices.filter(i => i.kind === "receivable").map(i => ({reference: i.number})), "INV") : nextSequenceNumber(invoices.filter(i => i.kind === "payable").map(i => ({reference: i.number})), "BILL");
      const dueDate = isoDaysFromNow(-spec.daysAgo + (spec.invoiceDueDays ?? 30));
      const invoice: Invoice = {
        id: uuid(),
        businessId,
        kind,
        number,
        partyName: spec.partyName,
        issueDate: date,
        dueDate,
        lineItems: [{ description: spec.memo || spec.category || spec.type, quantity: 1, unitPrice: spec.amount, amount: spec.amount }],
        subtotal: spec.amount,
        taxRate: spec.taxRate || 0,
        taxAmount,
        total: tx.totalAmount,
        amountPaid: 0,
        status: "sent",
        sourceTransactionId: tx.id,
        createdAt: tx.createdAt,
        createdBy: ownerUid,
      };
      invoices.push(invoice);
      tx.invoiceId = invoice.id;
      pushAudit("create", "invoice", invoice.id, `Generated invoice ${invoice.number} for ${invoice.partyName}`, spec.daysAgo);
    }

    return tx;
  }

  // --- Sales (cash + credit) ---
  const customers = ["Blue Bottle Café", "Riverside Diner", "Summit Grocers", "Maple & Vine Bistro", "Downtown Market"];
  recordTx({ type: "sale", paymentMethod: "bank", amount: 1450, taxRate: 8, partyName: customers[0], daysAgo: 58, memo: "Wholesale coffee beans order" });
  recordTx({ type: "sale", paymentMethod: "credit", amount: 3200, taxRate: 8, partyName: customers[1], daysAgo: 50, makeInvoice: true, invoiceDueDays: 30, memo: "Monthly coffee supply contract" });
  recordTx({ type: "sale", paymentMethod: "cash", amount: 620, taxRate: 8, partyName: "Walk-in retail customers", daysAgo: 45 });
  recordTx({ type: "sale", paymentMethod: "credit", amount: 2100, taxRate: 8, partyName: customers[2], daysAgo: 40, makeInvoice: true, invoiceDueDays: 15, memo: "Bulk roasted beans" });
  recordTx({ type: "sale", paymentMethod: "bank", amount: 980, taxRate: 8, partyName: customers[3], daysAgo: 33 });
  recordTx({ type: "sale", paymentMethod: "credit", amount: 4500, taxRate: 8, partyName: customers[4], daysAgo: 25, makeInvoice: true, invoiceDueDays: 30, memo: "Q3 wholesale order" });
  recordTx({ type: "sale", paymentMethod: "bank", amount: 1725, taxRate: 8, partyName: customers[0], daysAgo: 18, memo: "Repeat wholesale order" });
  recordTx({ type: "sale", paymentMethod: "cash", amount: 410, taxRate: 8, partyName: "Walk-in retail customers", daysAgo: 12 });
  recordTx({ type: "sale", paymentMethod: "credit", amount: 2850, taxRate: 8, partyName: customers[1], daysAgo: 6, makeInvoice: true, invoiceDueDays: 30, memo: "Monthly coffee supply contract" });

  // --- Purchases (inventory) ---
  const vendors = ["Highland Green Coffee Importers", "Cascade Packaging Co.", "Roastery Equipment Supply"];
  recordTx({ type: "purchase", paymentMethod: "credit", amount: 3800, taxRate: 0, partyName: vendors[0], daysAgo: 55, makeInvoice: true, invoiceDueDays: 30, memo: "Green coffee bean shipment" });
  recordTx({ type: "purchase", paymentMethod: "bank", amount: 620, taxRate: 8, partyName: vendors[1], daysAgo: 42, memo: "Packaging and bags" });
  recordTx({ type: "purchase", paymentMethod: "credit", amount: 2950, taxRate: 0, partyName: vendors[0], daysAgo: 28, makeInvoice: true, invoiceDueDays: 30, memo: "Green coffee bean shipment" });
  recordTx({ type: "purchase", paymentMethod: "bank", amount: 450, taxRate: 8, partyName: vendors[1], daysAgo: 15, memo: "Packaging restock" });
  recordTx({ type: "purchase", paymentMethod: "credit", amount: 4100, taxRate: 0, partyName: vendors[0], daysAgo: 5, makeInvoice: true, invoiceDueDays: 30, memo: "Green coffee bean shipment" });

  // --- Expenses ---
  recordTx({ type: "expense", paymentMethod: "bank", amount: 2200, taxRate: 0, partyName: "Downtown Properties LLC", category: "6000", daysAgo: 60, memo: "Monthly roastery rent" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 340, taxRate: 0, partyName: "City Utilities", category: "6100", daysAgo: 58, memo: "Electricity & water" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 6500, taxRate: 0, partyName: "Payroll", category: "6200", daysAgo: 45, memo: "Staff wages - biweekly" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 180, taxRate: 8, partyName: "Office Depot", category: "6300", daysAgo: 38, memo: "Office supplies" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 950, taxRate: 0, partyName: "Meta Ads", category: "6400", daysAgo: 32, memo: "Social media advertising" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 2200, taxRate: 0, partyName: "Downtown Properties LLC", category: "6000", daysAgo: 30, memo: "Monthly roastery rent" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 45, taxRate: 0, partyName: "First National Bank", category: "6500", daysAgo: 27, memo: "Monthly account fee" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 6500, taxRate: 0, partyName: "Payroll", category: "6200", daysAgo: 15, memo: "Staff wages - biweekly" });
  recordTx({ type: "expense", paymentMethod: "credit", amount: 1200, taxRate: 0, partyName: "Ledger & Co. Accounting", category: "6700", daysAgo: 10, memo: "Quarterly bookkeeping services" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 320, taxRate: 0, partyName: "City Utilities", category: "6100", daysAgo: 8, memo: "Electricity & water" });
  recordTx({ type: "expense", paymentMethod: "bank", amount: 2200, taxRate: 0, partyName: "Downtown Properties LLC", category: "6000", daysAgo: 1, memo: "Monthly roastery rent" });

  // --- Receipts (customer payments against open invoices) ---
  applyReceiptToInvoice(customers[1], 20);
  applyReceiptToInvoice(customers[2], 33);

  function applyReceiptToInvoice(partyName: string, daysAgo: number) {
    const inv = invoices.find((i) => i.kind === "receivable" && i.partyName === partyName && i.amountPaid < i.total);
    if (!inv) return;
    const date = isoDaysAgo(daysAgo);
    const settle = accountByCode("1010");
    const ar = accountByCode("1200");
    const lines = [
      { accountId: settle.id, accountCode: settle.code, accountName: settle.name, debit: inv.total, credit: 0, memo: `Payment received from ${partyName}` },
      { accountId: ar.id, accountCode: ar.code, accountName: ar.name, debit: 0, credit: inv.total, memo: `Applied to invoice ${inv.number}` },
    ];
    validateBalanced(lines);
    const je: JournalEntry = {
      id: uuid(),
      businessId,
      date,
      reference: nextSequenceNumber(journalEntries, "JE"),
      description: `Receipt - ${partyName}`,
      sourceType: "receipt",
      sourceId: inv.id,
      lines,
      totalDebit: inv.total,
      totalCredit: inv.total,
      createdAt: date + "T00:00:00.000Z",
      createdBy: ownerUid,
    };
    journalEntries.push(je);
    const tx: Transaction = {
      id: uuid(),
      businessId,
      type: "receipt",
      date,
      paymentMethod: "bank",
      amount: inv.total,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: inv.total,
      partyName,
      memo: `Payment for invoice ${inv.number}`,
      invoiceId: inv.id,
      journalEntryId: je.id,
      createdAt: je.createdAt,
      createdBy: ownerUid,
    };
    transactions.push(tx);
    inv.amountPaid = inv.total;
    inv.status = "paid";
    pushAudit("record_payment", "invoice", inv.id, `Recorded full payment for invoice ${inv.number}`, daysAgo);
  }

  // --- Payment made against a vendor bill ---
  {
    const bill = invoices.find((i) => i.kind === "payable");
    if (bill) {
      const date = isoDaysAgo(20);
      const ap = accountByCode("2000");
      const settle = accountByCode("1010");
      const lines = [
        { accountId: ap.id, accountCode: ap.code, accountName: ap.name, debit: bill.total, credit: 0, memo: `Applied to bill ${bill.number}` },
        { accountId: settle.id, accountCode: settle.code, accountName: settle.name, debit: 0, credit: bill.total, memo: `Payment made to ${bill.partyName}` },
      ];
      validateBalanced(lines);
      const je: JournalEntry = {
        id: uuid(),
        businessId,
        date,
        reference: nextSequenceNumber(journalEntries, "JE"),
        description: `Payment - ${bill.partyName}`,
        sourceType: "payment",
        sourceId: bill.id,
        lines,
        totalDebit: bill.total,
        totalCredit: bill.total,
        createdAt: date + "T00:00:00.000Z",
        createdBy: ownerUid,
      };
      journalEntries.push(je);
      const tx: Transaction = {
        id: uuid(),
        businessId,
        type: "payment",
        date,
        paymentMethod: "bank",
        amount: bill.total,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: bill.total,
        partyName: bill.partyName,
        memo: `Payment for bill ${bill.number}`,
        invoiceId: bill.id,
        journalEntryId: je.id,
        createdAt: je.createdAt,
        createdBy: ownerUid,
      };
      transactions.push(tx);
      bill.amountPaid = bill.total;
      bill.status = "paid";
      pushAudit("record_payment", "invoice", bill.id, `Recorded full payment for bill ${bill.number}`, 20);
    }
  }

  // --- Bank feed (CSV import demo): mostly mirrors recorded bank transactions plus a couple unmatched lines ---
  const bankTransactions: BankTransaction[] = [];
  const importBatchId = uuid();
  const bankSettleTx = transactions.filter((t) => t.paymentMethod === "bank" || t.type === "receipt" || t.type === "payment");
  for (const t of bankSettleTx) {
    const outflow = t.type === "purchase" || t.type === "expense" || t.type === "payment";
    bankTransactions.push({
      id: uuid(),
      businessId,
      date: t.date,
      description: `${t.partyName}${t.memo ? " - " + t.memo : ""}`,
      amount: outflow ? -t.totalAmount : t.totalAmount,
      matchedTransactionId: t.id,
      status: "matched",
      importBatchId,
      createdAt: t.createdAt,
    });
  }
  // A couple of unreconciled lines representing bank fees / uncategorized activity.
  bankTransactions.push({
    id: uuid(),
    businessId,
    date: isoDaysAgo(3),
    description: "MONTHLY SERVICE FEE",
    amount: -18,
    status: "unmatched",
    importBatchId,
    createdAt: isoDaysAgo(3) + "T00:00:00.000Z",
  });
  bankTransactions.push({
    id: uuid(),
    businessId,
    date: isoDaysAgo(2),
    description: "INTEREST EARNED",
    amount: 4.32,
    status: "unmatched",
    importBatchId,
    createdAt: isoDaysAgo(2) + "T00:00:00.000Z",
  });
  pushAudit("import_bank_csv", "bankTransactions", importBatchId, `Imported ${bankTransactions.length} bank transactions`, 3);

  return { business, accounts, transactions, journalEntries, invoices, bankTransactions, auditLog };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
