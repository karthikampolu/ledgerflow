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

const cloudPoints = [
  {
    title: "Nothing lives on one machine",
    detail: "Every journal entry, invoice, and ledger balance is written to Firestore the moment it's created — not to a local file.",
  },
  {
    title: "Open it from anywhere",
    detail: "Log in from a laptop, a shared office computer, or a phone browser and see the same ledger, instantly.",
  },
  {
    title: "Encrypted and backed up",
    detail: "Data is isolated per business account, encrypted in transit and at rest, and never depends on a single device surviving.",
  },
];

// Sidebar sections mirrored from the actual app routes, used by the wireframe below.
const wireframeNav = [
  "Dashboard",
  "Invoices",
  "Ledger",
  "Transactions",
  "Payables",
  "Receivables",
  "Bank",
  "Reports",
  "Accounts",
  "Audit",
  "Settings",
];

const wireframeCoverage = [
  { label: "Dashboard", detail: "At-a-glance cash position, recent activity, and outstanding balances." },
  { label: "Invoices & receivables", detail: "Create, send, and track what customers still owe." },
  { label: "Ledger & transactions", detail: "Every journal entry, searchable, with its source." },
  { label: "Payables & bank", detail: "Bills to pay and bank-feed reconciliation, side by side." },
  { label: "Reports & audit", detail: "P&L, balance sheet, cash flow, and a full change history." },
];

/**
 * Low-fidelity wireframe of the authenticated app shell — grayscale, boxes and
 * placeholder lines only, deliberately not a colored mockup. Mirrors the real
 * sidebar sections (accounts, audit, bank, dashboard, invoices, ledger,
 * payables, receivables, reports, settings, transactions).
 */
function AppWireframe() {
  const navY = (i: number) => 118 + i * 34;
  const bars = [58, 92, 40, 120, 70, 100, 46, 84];
  const barAreaX = 224;
  const barAreaW = 460;
  const barAreaY = 196;
  const barAreaH = 160;
  const barGap = 10;
  const barW = (barAreaW - barGap * (bars.length - 1)) / bars.length;
  const maxBar = Math.max(...bars);
  const tableRows = 4;
  const tableY = 392;
  const tableRowH = 32;
  const tableColX = [244, 400, 560, 820];

  return (
    <svg
      viewBox="0 0 960 600"
      className="h-auto w-full"
      role="img"
      aria-label="Wireframe of the LedgerFlow dashboard: sidebar navigation, summary cards, a chart, and a transactions table."
    >
      <rect x="1" y="1" width="958" height="598" rx="10" fill="#FFFFFF" stroke="#D8D8D2" strokeWidth="1.5" />

      {/* Top bar */}
      <line x1="0" y1="56" x2="960" y2="56" stroke="#E4E4E0" />
      <circle cx="24" cy="28" r="5" fill="#E4E4E0" />
      <circle cx="44" cy="28" r="5" fill="#E4E4E0" />
      <circle cx="64" cy="28" r="5" fill="#E4E4E0" />
      <rect x="110" y="16" width="240" height="24" rx="6" fill="#F4F4F0" stroke="#E4E4E0" />
      <circle cx="924" cy="28" r="14" fill="#E4E4E0" />

      {/* Sidebar */}
      <line x1="200" y1="56" x2="200" y2="600" stroke="#E4E4E0" />
      <rect x="24" y="78" width="90" height="10" rx="2" fill="#D8D8D2" />
      {wireframeNav.map((item, i) => {
        const active = i === 0;
        return (
          <g key={item}>
            {active && <rect x="12" y={navY(i) - 10} width="176" height="26" rx="6" fill="#0F7A5D" fillOpacity="0.1" />}
            <rect x="24" y={navY(i) - 6} width="11" height="11" rx="2" fill={active ? "#0F7A5D" : "#D8D8D2"} />
            <rect
              x="46"
              y={navY(i) - 4.5}
              width={34 + ((item.length * 7) % 46)}
              height="8"
              rx="2"
              fill={active ? "#0F7A5D" : "#D8D8D2"}
              fillOpacity={active ? 1 : 0.8}
            />
          </g>
        );
      })}

      {/* Stat cards */}
      {[0, 1, 2, 3].map((i) => {
        const w = 166;
        const gap = 16;
        const x = 224 + i * (w + gap);
        return (
          <g key={i}>
            <rect x={x} y="80" width={w} height="76" rx="8" fill="#FFFFFF" stroke="#E4E4E0" />
            <rect x={x + 14} y="96" width="60" height="7" rx="2" fill="#D8D8D2" />
            <rect x={x + 14} y="118" width="50" height="14" rx="2" fill="#B7B7AF" />
          </g>
        );
      })}

      {/* Chart card */}
      <rect x={barAreaX} y="176" width={barAreaW} height={barAreaH + 24} rx="8" fill="#FFFFFF" stroke="#E4E4E0" />
      <rect x={barAreaX + 14} y="190" width="90" height="8" rx="2" fill="#D8D8D2" />
      {bars.map((h, i) => {
        const height = (h / maxBar) * (barAreaH - 40);
        const x = barAreaX + 14 + i * (barW + barGap);
        const y = barAreaY + 30 + (barAreaH - 40 - height);
        return <rect key={i} x={x} y={y} width={barW - 4} height={height} rx="2" fill="#0F7A5D" fillOpacity="0.55" />;
      })}

      {/* Summary card (right) */}
      <rect x="700" y="176" width="236" height={barAreaH + 24} rx="8" fill="#FFFFFF" stroke="#E4E4E0" />
      <rect x="714" y="190" width="70" height="8" rx="2" fill="#D8D8D2" />
      <circle cx="770" cy="270" r="46" fill="none" stroke="#E4E4E0" strokeWidth="14" />
      <circle
        cx="770"
        cy="270"
        r="46"
        fill="none"
        stroke="#0F7A5D"
        strokeWidth="14"
        strokeDasharray="180 289"
        strokeLinecap="round"
        transform="rotate(-90 770 270)"
      />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="714" y={332 + i * 14} width="8" height="8" rx="2" fill={i === 0 ? "#0F7A5D" : "#D8D8D2"} />
          <rect x="730" y={332.5 + i * 14} width={60 - i * 10} height="7" rx="2" fill="#E4E4E0" />
        </g>
      ))}

      {/* Table */}
      <rect x="224" y={tableY} width="712" height={28 + tableRows * tableRowH} rx="8" fill="#FFFFFF" stroke="#E4E4E0" />
      <rect x="224" y={tableY} width="712" height="28" rx="8" fill="#F5F5F1" />
      {tableColX.map((x, i) => (
        <rect key={i} x={x} y={tableY + 11} width={i === 3 ? 40 : 56} height="7" rx="2" fill="#B7B7AF" />
      ))}
      {Array.from({ length: tableRows }).map((_, r) => {
        const y = tableY + 28 + r * tableRowH;
        return (
          <g key={r}>
            {r > 0 && <line x1="224" y1={y} x2="936" y2={y} stroke="#EDEDE9" />}
            {tableColX.map((x, i) => (
              <rect
                key={i}
                x={x}
                y={y + tableRowH / 2 - 4}
                width={i === 3 ? 44 : 70 - ((r + i) % 3) * 12}
                height="8"
                rx="2"
                fill="#D8D8D2"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Colored architecture / data-flow diagram matching the five-layer flow
 * above: entry point, app, rules engine, cloud database, reports. The
 * Firestore layer is called out to make the cloud-storage point visible,
 * not just stated in text.
 */
function ArchitectureDiagram() {
  const boxes = [
    { label: "Business owner", sub: "Enters sales, purchases, expenses", fill: "#151B23" },
    { label: "LedgerFlow web app", sub: "Sales · purchases · expenses · invoices", fill: "#1E3A5F" },
    { label: "Accounting rules engine", sub: "Deterministic debit/credit mapping", fill: "#155E4F" },
    { label: "Cloud database — Firebase", sub: "Auth + Firestore · encrypted · real-time", fill: "#0F7A5D" },
    { label: "Reports & dashboard", sub: "P&L · balance sheet · cash flow · tax", fill: "#3B4252" },
  ];
  const boxH = 64;
  const gap = 34;
  const x = 60;
  const w = 520;

  return (
    <svg
      viewBox="0 0 640 560"
      className="h-auto w-full max-w-md"
      role="img"
      aria-label="Data flow diagram: business owner to LedgerFlow web app to accounting rules engine to Firebase cloud database to reports and dashboard."
    >
      {boxes.map((b, i) => {
        const y = i * (boxH + gap) + 12;
        const cloud = b.label.includes("Cloud");
        return (
          <g key={b.label}>
            {i > 0 && (
              <line
                x1={x + w / 2}
                y1={y - gap + 4}
                x2={x + w / 2}
                y2={y - 4}
                stroke="#B7B7AF"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}
            <rect
              x={x}
              y={y}
              width={w}
              height={boxH}
              rx="10"
              fill={b.fill}
              stroke={cloud ? "#0C6249" : "none"}
              strokeWidth={cloud ? 2 : 0}
            />
            {cloud && (
              <path
                d="M18 8c-3-6-11-6-13 1-5 0-8 6-3 9h20c4-2 3-9-4-10z"
                transform={`translate(${x + 16} ${y + 22})`}
                fill="#FFFFFF"
                fillOpacity="0.85"
              />
            )}
            <text x={x + (cloud ? 44 : 20)} y={y + 27} fill="#FFFFFF" fontSize="15" fontWeight="600">
              {b.label}
            </text>
            <text x={x + (cloud ? 44 : 20)} y={y + 46} fill="#FFFFFF" fillOpacity="0.72" fontSize="12">
              {b.sub}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#B7B7AF" />
        </marker>
      </defs>
    </svg>
  );
}

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
            <Link href="#wireframe" className="hidden text-sm text-[#3F3F3C] hover:text-[#151B23] sm:inline">
              Wireframe
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

      {/* Wireframe of the app shell */}
      <section id="wireframe" className="border-y border-[#E4E4E0] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-[#151B23]">
              The workspace, laid out
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#4B4B47]">
              One sidebar, every accounting function. This is the actual structure of
              the app behind the login — dashboard, ledger, invoices, payables,
              receivables, bank, reports, accounts, audit, and settings, all in one
              shell.
            </p>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            <div className="rounded-lg border border-[#E4E4E0] p-3">
              <AppWireframe />
            </div>
            <div className="divide-y divide-[#E4E4E0]">
              {wireframeCoverage.map((c) => (
                <div key={c.label} className="py-4 first:pt-0">
                  <div className="text-sm font-medium text-[#151B23]">{c.label}</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works / architecture */}
      <section id="how-it-works" className="bg-[#101826] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How a transaction becomes a report</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#A6ACB8]">
            Five steps, from the moment you enter something to the moment it shows
            up in a financial statement — and where the data actually lives along
            the way.
          </p>
          <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <ArchitectureDiagram />
            <div>
              <div className="space-y-0">
                {flow.map((f, i) => (
                  <div key={f.step} className="flex gap-6 border-t border-white/10 py-5 first:border-t-0 first:pt-0">
                    <div className="w-8 shrink-0 text-sm text-[#6FA98F]">{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="text-base font-medium">{f.step}</div>
                      <p className="mt-1 text-sm leading-relaxed text-[#A6ACB8]">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-medium text-white">Cloud-based, not local</div>
                <p className="mt-2 text-sm leading-relaxed text-[#A6ACB8]">
                  The layer highlighted above — Firebase Auth and Firestore — is a
                  managed cloud database, not a file on one machine. Every business's
                  ledger is stored there, so it's reachable the moment you log in,
                  from whatever device you're on.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud storage highlight */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#151B23]">
            Your books, stored in the cloud
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#4B4B47]">
            LedgerFlow doesn't save anything to the computer you're using. Every
            journal entry is written straight to a managed cloud database, so it's
            never tied to one device or one browser.
          </p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {cloudPoints.map((c) => (
            <div key={c.title} className="border-l-2 border-[#0F7A5D] pl-4">
              <div className="text-base font-medium text-[#151B23]">{c.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{c.detail}</p>
            </div>
          ))}
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