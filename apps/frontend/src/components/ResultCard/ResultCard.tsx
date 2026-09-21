import type { Calculation } from "@car-calculator/types";
import { Link } from "react-router-dom";
import { routes } from "../../constants/routes";
import { StatField } from "../../ui/StatField/StatField";
import { formatUSD, formatMileage } from "../../utils/formatters";

interface ResultCardProps {
  readonly result: Calculation;
}

export function ResultCard({ result }: ResultCardProps) {
  const formattedPrice = result.avgPrice ? formatUSD(result.avgPrice) : "—";
  const formattedMileage = result.avgMileage ? formatMileage(result.avgMileage) : "—";

  return (
    <div className="mt-8 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-6 shadow-sm">
      <div className="flex items-start gap-5">
        {result.photoUrl && (
          <img
            src={result.photoUrl}
            alt={`${result.brand} ${result.model}`}
            className="h-28 w-44 rounded-xl object-cover shadow-md flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-teal-600 uppercase tracking-wide">
            Результат розрахунку
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            {result.brand} {result.model}
          </h2>
          <p className="text-sm text-slate-500">
            {result.yearFrom}–{result.yearTo} · {result.region}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatField label="Середня ціна" value={formattedPrice} variant="primary" />
            <StatField label="Середній пробіг" value={formattedMileage} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-teal-100 pt-4">
        <p className="text-xs text-slate-400">
          Розраховано на основі ринкових даних
        </p>
        <Link
          to={routes.history}
          className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          Переглянути історію →
        </Link>
      </div>
    </div>
  );
}
