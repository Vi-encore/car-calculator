interface StatFieldProps {
  readonly label: string;
  readonly value: string;
  readonly variant?: "primary" | "secondary";
}

export function StatField({ label, value, variant = "secondary" }: StatFieldProps) {
  const valueStyles = {
    primary: "mt-0.5 text-3xl font-extrabold text-teal-600",
    secondary: "mt-0.5 text-xl font-bold text-slate-700",
  };

  return (
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className={valueStyles[variant]}>{value}</p>
    </div>
  );
}
