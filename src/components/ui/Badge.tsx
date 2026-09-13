import { cx } from "@/lib/utils";

type Tone = "gray" | "green" | "red" | "amber" | "indigo" | "blue";

const toneClasses: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
  green: "bg-[var(--positive-light)] text-[var(--positive)] ring-1 ring-inset ring-emerald-100",
  red: "bg-[var(--negative-light)] text-[var(--negative)] ring-1 ring-inset ring-rose-100",
  amber: "bg-[var(--warning-light)] text-[var(--warning)] ring-1 ring-inset ring-amber-100",
  indigo: "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-inset ring-violet-100",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100",
};

export function Badge({ children, tone = "gray", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "paid":
    case "matched":
    case "posted":
      return "green";
    case "overdue":
    case "void":
      return "red";
    case "partially_paid":
    case "pending":
      return "amber";
    case "sent":
      return "blue";
    case "draft":
    case "unmatched":
    case "ignored":
    default:
      return "gray";
  }
}
