import { ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-dark)] active:scale-[0.98] disabled:bg-violet-300 disabled:active:scale-100",
  secondary:
    "bg-white text-gray-700 border border-gray-300 shadow-sm hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
  ghost: "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  danger:
    "bg-[var(--negative)] text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] disabled:bg-rose-300 disabled:active:scale-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
