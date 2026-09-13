import { ReactNode } from "react";
import { cx } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type Tone = "brand" | "positive" | "negative" | "amber";

const iconToneClasses: Record<Tone, string> = {
  brand: "bg-[var(--brand-light)] text-[var(--brand)]",
  positive: "bg-[var(--positive-light)] text-[var(--positive)]",
  negative: "bg-[var(--negative-light)] text-[var(--negative)]",
  amber: "bg-[var(--warning-light)] text-[var(--warning)]",
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        {icon && <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", iconToneClasses[tone])}>{icon}</span>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 num">{value}</div>
      {delta && (
        <div
          className={cx(
            "mt-1.5 text-xs font-medium",
            deltaTone === "positive" && "text-[var(--positive)]",
            deltaTone === "negative" && "text-[var(--negative)]",
            deltaTone === "neutral" && "text-gray-500"
          )}
        >
          {delta}
        </div>
      )}
    </Card>
  );
}
