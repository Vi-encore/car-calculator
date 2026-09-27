import type { Calculation } from "@car-calculator/types";
import { Link } from "react-router-dom";
import { StatField } from "../../ui/StatField/StatField";
import { routes } from "../../constants/routes";
import { formatUSD, formatMileage, formatDateShort } from "../../utils/formatters";

interface CalculationCardProps {
  readonly calculation: Calculation;
}

export function CalculationCard({ calculation }: CalculationCardProps) {
  const formattedPrice = calculation.avgPrice ? formatUSD(calculation.avgPrice) : "—";
  const formattedMileage = calculation.avgMileage ? formatMileage(calculation.avgMileage) : "—";
  const formattedDate = formatDateShort(calculation.createdAt);

  return (
    <Link
      to={routes.historyDetail(calculation.id)}
      className="block flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5"
    >
      {calculation.photoUrl && (
        <img
          src={calculation.photoUrl}
          alt={`${calculation.brand} ${calculation.model}`}
          className="h-20 w-32 rounded-xl object-cover flex-shrink-0"
        />
      )}

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800 truncate">
              {calculation.brand} {calculation.model}
            </h3>
            <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
              {formattedDate}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {calculation.yearFrom}–{calculation.yearTo} · {calculation.region}
          </p>
        </div>

        <div className="mt-3 flex gap-6">
          <StatField label="Середня ціна" value={formattedPrice} variant="primary" />
          <StatField label="Середній пробіг" value={formattedMileage} />
        </div>
      </div>
    </Link>
  );
}
