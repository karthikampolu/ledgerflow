import { cx } from "@/lib/utils";

type Tone = "gray" | "green" | "red" | "amber" | "indigo" | "blue";

const toneClasses: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
  blue: "bg-blue-50 text-blue-700",
};

export function Badge({ children, tone = "gray", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", toneClasses[tone], className)}>
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
