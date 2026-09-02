import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader } from "../Loader/Loader";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "outline" | "ghost" | "danger";
  readonly size?: "sm" | "md" | "lg";
  readonly isLoading?: boolean;
  readonly children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  children,
  className = "",
  disabled,
  ...props
}: Readonly<ButtonProps>) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-sm hover:opacity-95 shadow-teal-500/20",
    outline:
      "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-600 hover:text-teal-600 hover:bg-teal-50/50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader size="sm" className="border-white border-t-transparent" />
          <span>Зачекайте...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

Button.displayName = "Button";
