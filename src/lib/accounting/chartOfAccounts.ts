import { Account } from "@/lib/types";

/**
 * Standard default Chart of Accounts seeded for every new business.
 * Codes follow conventional GAAP-style numbering blocks:
 *  1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue,
 *  5000s COGS, 6000s Operating Expenses, 7000s Taxes.
 */
export interface DefaultAccountSeed {
  code: string;
  name: string;
  type: Account["type"];
  subtype: Account["subtype"];
  description: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccountSeed[] = [
  // Assets
  { code: "1000", name: "Cash on Hand", type: "asset", subtype: "current_asset", description: "Physical cash held by the business" },
  { code: "1010", name: "Business Bank Account", type: "asset", subtype: "current_asset", description: "Primary operating bank account" },
  { code: "1200", name: "Accounts Receivable", type: "asset", subtype: "current_asset", description: "Amounts owed by customers" },
  { code: "1400", name: "Inventory", type: "asset", subtype: "current_asset", description: "Goods held for resale" },
  { code: "1500", name: "Prepaid Expenses", type: "asset", subtype: "current_asset", description: "Expenses paid in advance" },
  { code: "1900", name: "Fixed Assets & Equipment", type: "asset", subtype: "fixed_asset", description: "Equipment, furniture, and property" },

  // Liabilities
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: "current_liability", description: "Amounts owed to vendors" },
  { code: "2100", name: "Sales Tax Payable", type: "liability", subtype: "current_liability", description: "Sales tax collected, owed to tax authority" },
  { code: "2200", name: "Accrued Liabilities", type: "liability", subtype: "current_liability", description: "Accrued but unpaid obligations" },
  { code: "2500", name: "Long-Term Debt", type: "liability", subtype: "long_term_liability", description: "Loans and notes payable beyond one year" },

  // Equity
  { code: "3000", name: "Owner's Equity", type: "equity", subtype: "equity", description: "Owner capital contributions" },
  { code: "3900", name: "Retained Earnings", type: "equity", subtype: "equity", description: "Accumulated net income/loss" },

  // Revenue
  { code: "4000", name: "Sales Revenue", type: "revenue", subtype: "operating_revenue", description: "Revenue from sale of goods/services" },
  { code: "4900", name: "Other Income", type: "revenue", subtype: "other_revenue", description: "Non-operating income" },

  // COGS
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cogs", description: "Direct cost of goods/services sold" },

  // Operating Expenses
  { code: "6000", name: "Rent Expense", type: "expense", subtype: "operating_expense", description: "Office/warehouse rent" },
  { code: "6100", name: "Utilities Expense", type: "expense", subtype: "operating_expense", description: "Electricity, water, internet" },
  { code: "6200", name: "Salaries & Wages", type: "expense", subtype: "operating_expense", description: "Employee compensation" },
  { code: "6300", name: "Office Supplies", type: "expense", subtype: "operating_expense", description: "Office supplies and materials" },
  { code: "6400", name: "Marketing & Advertising", type: "expense", subtype: "operating_expense", description: "Marketing campaigns and ads" },
  { code: "6500", name: "Bank Fees & Charges", type: "expense", subtype: "operating_expense", description: "Bank service charges" },
  { code: "6600", name: "Travel & Entertainment", type: "expense", subtype: "operating_expense", description: "Business travel and client entertainment" },
  { code: "6700", name: "Professional Fees", type: "expense", subtype: "operating_expense", description: "Legal, accounting, consulting fees" },
  { code: "6900", name: "Miscellaneous Expense", type: "expense", subtype: "operating_expense", description: "Other operating expenses" },

  // Tax
  { code: "7000", name: "Income Tax Expense", type: "expense", subtype: "tax_expense", description: "Estimated income tax expense" },
];

export const EXPENSE_CATEGORY_ACCOUNT_CODES = DEFAULT_CHART_OF_ACCOUNTS.filter(
  (a) => a.type === "expense" && a.code !== "5000" && a.code !== "7000"
).map((a) => a.code);
