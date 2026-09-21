import Link from "next/link";

const processes = [
  {
    name: "Bookkeeping",
    detail: "Every sale, purchase, and expense posts a balanced journal entry automatically — no manual double-entry.",
  },
  {
    name: "Expense tracking",
    detail: "Capture a receipt or bank line and LedgerFlow codes it to the right ledger account for you.",
  },
  {
    name: "Invoicing & receivables",
    detail: "Send invoices, track what's outstanding, and reconcile payments against open balances.",
  },
  {
    name: "Payables",
    detail: "Log bills as they arrive, schedule payments, and keep vendor balances current.",
  },
  {
    name: "Bank reconciliation",
    detail: "Match bank feed transactions to ledger entries and flag anything that doesn't line up.",
  },
  {
    name: "Tax & compliance",
    detail: "Categorize transactions against tax rules as they're entered, not scrambled together at filing time.",
  },
  {
    name: "Payroll",
    detail: "Run payroll and post the wage, tax, and benefit entries straight to the general ledger.",
  },
  {
    name: "Financial reporting",
    detail: "P&L, balance sheet, and cash flow build themselves from the ledger — always current, never re-keyed.",
  },
];

const flow = [
  {
    step: "Business owner",
    detail: "Sales, purchases, expenses, and invoices — entered once, from any device.",
  },
  {
    step: "LedgerFlow web app",
    detail: "The interface where daily transactions happen. Built to need no accounting background.",
  },
  {
    step: "Accounting rules engine",
    detail: "Applies double-entry logic automatically: every transaction becomes a validated debit and credit.",
  },
  {
    step: "Firebase — Auth & Firestore",
    detail: "Journal entries and the general ledger are stored securely, per business, in real time.",
  },
  {
    step: "Reports & dashboard",
    detail: "P&L, balance sheet, cash flow, and tax summaries, generated straight from the ledger.",
  },
];

const users = [
  { label: "Freelancers", detail: "One person, one login, no separate spreadsheet for taxes." },
  { label: "Startups", detail: "Books that are investor-ready from day one, without hiring a bookkeeper first." },
  { label: "Small businesses", detail: "Payables, receivables, and payroll in one place instead of three tools." },
  { label: "Retail stores", detail: "High transaction volume handled through bank feeds, not manual entry." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#151B23]">
      {/* Nav */}
      <header className="border-b border-[#E4E4E0]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">LedgerFlow</span>
            <span className="hidden text-sm text-[#6B7280] sm:inline">accounting, automated</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="hidden text-sm text-[#3F3F3C] hover:text-[#151B23] sm:inline">
              What it does
            </Link>
            <Link href="#how-it-works" className="hidden text-sm text-[#3F3F3C] hover:text-[#151B23] sm:inline">
              How it works
            </Link>
            <Link href="/login" className="text-sm text-[#3F3F3C] hover:text-[#151B23]">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#0F7A5D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C6249] transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-[#151B23] sm:text-5xl">
              Close your books without touching a spreadsheet.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#4B4B47]">
              LedgerFlow turns everyday sales, purchases, and expenses into balanced
              journal entries the moment they happen — so freelancers, startups, and
              small businesses always know where they stand.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-[#0F7A5D] px-6 py-3 text-sm font-medium text-white hover:bg-[#0C6249] transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-[#151B23] underline decoration-[#C9C9C2] underline-offset-4 hover:decoration-[#151B23]"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Ledger-style hero visual instead of a generic dashboard screenshot */}
          <div className="rounded-lg border border-[#E4E4E0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E4E4E0] px-5 py-3">
              <span className="text-sm font-medium text-[#151B23]">General ledger</span>
              <span className="text-xs text-[#8A8A83]">auto-posted</span>
            </div>
            <div className="divide-y divide-[#EDEDE9]">
              {[
                { desc: "Invoice #1042 — Acme Retail", debit: "Accounts Receivable", credit: "Sales Revenue", amt: "$1,250.00" },
                { desc: "Office supplies — Staples", debit: "Office Expense", credit: "Bank", amt: "$84.30" },
                { desc: "Payroll run — Sept 15", debit: "Wages Expense", credit: "Bank", amt: "$6,400.00" },
                { desc: "Vendor bill — CloudHost Inc.", debit: "Software Expense", credit: "Accounts Payable", amt: "$219.00" },
              ].map((row) => (
                <div key={row.desc} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#151B23]">{row.desc}</span>
                    <span className="text-sm font-medium text-[#151B23]">{row.amt}</span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-[#8A8A83]">
                    <span>Dr {row.debit}</span>
                    <span>Cr {row.credit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-y border-[#E4E4E0] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-sm font-medium text-[#6B7280]">Built for people who run the numbers themselves</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {users.map((u) => (
              <div key={u.label} className="border-l-2 border-[#0F7A5D] pl-4">
                <div className="text-base font-medium text-[#151B23]">{u.label}</div>
                <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{u.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / accounting processes */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#151B23]">
            One ledger, every accounting process
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#4B4B47]">
            Each of these feeds the same general ledger, so your reports are never
            built from disconnected tools.
          </p>
        </div>
        <div className="mt-10 divide-y divide-[#E4E4E0] border-y border-[#E4E4E0]">
          {processes.map((p) => (
            <div key={p.name} className="grid gap-1 py-5 sm:grid-cols-[220px_1fr] sm:gap-6">
              <div className="text-base font-medium text-[#151B23]">{p.name}</div>
              <p className="text-sm leading-relaxed text-[#6B7280]">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works / architecture */}
      <section id="how-it-works" className="bg-[#101826] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How a transaction becomes a report</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#A6ACB8]">
            Five steps, from the moment you enter something to the moment it shows
            up in a financial statement.
          </p>
          <div className="mt-12 space-y-0">
            {flow.map((f, i) => (
              <div key={f.step} className="flex gap-6 border-t border-white/10 py-6 first:border-t-0">
                <div className="w-8 shrink-0 text-sm text-[#6FA98F]">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div className="text-base font-medium">{f.step}</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#A6ACB8]">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="text-3xl font-semibold text-[#151B23]">0</div>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              manual journal entries — every transaction posts itself, correctly.
            </p>
          </div>
          <div>
            <div className="text-3xl font-semibold text-[#151B23]">Real-time</div>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              P&L, balance sheet, and cash flow, current the moment a transaction lands.
            </p>
          </div>
          <div>
            <div className="text-3xl font-semibold text-[#151B23]">Audit-ready</div>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Every entry keeps its source, so tax time and audits start from a clean trail.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E4E4E0] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#151B23]">
              Set up your ledger in a few minutes.
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">No credit card. No accounting degree required.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-md bg-[#0F7A5D] px-6 py-3 text-sm font-medium text-white hover:bg-[#0C6249] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E0]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-[#8A8A83] sm:flex-row sm:items-center">
          <span>LedgerFlow</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#151B23]">Log in</Link>
            <Link href="/signup" className="hover:text-[#151B23]">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}