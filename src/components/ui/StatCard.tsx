import { ReactNode } from "react";
import { cx } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 num">{value}</div>
      {delta && (
        <div
          className={cx(
            "mt-1 text-xs font-medium",
            deltaTone === "positive" && "text-emerald-600",
            deltaTone === "negative" && "text-red-600",
            deltaTone === "neutral" && "text-gray-500"
          )}
        >
          {delta}
        </div>
      )}
    </Card>
  );
}
