import { useParams, Link, Navigate } from "react-router-dom";
import { useGetCalculationByIdQuery } from "../../store/api/calculationsApi";
import { routes } from "../../constants/constantRoute";
import { StatField } from "../../ui/StatField/StatField";
import { Loader } from "../../ui/Loader/Loader";
import { CarListingsTable } from "../../components/CarListingsTable/CarListingsTable";
import { formatUSD, formatMileage, formatDateFull } from "../../utils/formatters";

// ─── Calculation Detail Page ──────────────────────────────────────────────────
export function CalculationDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Guard: якщо URL без id — перенаправляємо на список
  if (!id) return <Navigate to={routes.history} replace />;

  const { data: calc, isLoading, isError } = useGetCalculationByIdQuery(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  if (isError || !calc) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-600">
            Розрахунок не знайдено або у вас немає доступу.
          </p>
          <Link to={routes.history} className="mt-4 inline-block text-sm font-semibold text-teal-600 hover:underline">
            ← Повернутись до історії
          </Link>
        </div>
      </div>
    );
  }

  const formattedPrice = calc.avgPrice ? formatUSD(calc.avgPrice) : "—";
  const formattedMileage = calc.avgMileage ? formatMileage(calc.avgMileage) : "—";
  const formattedDate = formatDateFull(calc.createdAt);

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Назад */}
      <Link
        to={routes.history}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        ← Повернутись до історії
      </Link>

      {/* Заголовок */}
      <div className="flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {calc.photoUrl && (
          <img
            src={calc.photoUrl}
            alt={`${calc.brand} ${calc.model}`}
            className="h-32 w-52 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">
            Деталі розрахунку
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            {calc.brand} {calc.model}
          </h1>
          <p className="text-sm text-slate-500">
            {calc.yearFrom}–{calc.yearTo} · {calc.region}
          </p>
          {calc.mileageFrom != null || calc.mileageTo != null ? (
            <p className="mt-1 text-xs text-slate-400">
              Пробіг:{" "}
              {calc.mileageFrom != null ? `від ${formatMileage(calc.mileageFrom)}` : ""}
              {calc.mileageTo != null ? ` до ${formatMileage(calc.mileageTo)}` : ""}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-6">
            <StatField label="Середня ціна" value={formattedPrice} variant="primary" />
            <StatField label="Середній пробіг" value={formattedMileage} />
          </div>

          <p className="mt-4 text-xs text-slate-400">{formattedDate}</p>
        </div>
      </div>

      {/* Список авто */}
      <CarListingsTable listings={calc.carListings} avgPrice={calc.avgPrice} />
    </div>
  );
}

