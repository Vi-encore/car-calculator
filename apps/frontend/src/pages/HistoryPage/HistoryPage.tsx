import { Link } from "react-router-dom";
import { useHistory } from "./hooks/useHistory";
import { CalculationCard } from "../../components/CalculationCard/CalculationCard";
import { Button } from "../../ui/Button/Button";
import { routes } from "../../constants/routes";
import { Loader } from "../../ui/Loader/Loader";

export function HistoryPage() {
  const {
    calculations,
    total,
    totalPages,
    page,
    isLoading,
    isFetching,
    isError,
    goToPage,
  } = useHistory();

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Заголовок */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Історія розрахунків 📋
          </h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Знайдено {total} {total === 1 ? "розрахунок" : "розрахунків"}
            </p>
          )}
        </div>
        <Link to={routes.calculator}>
          <Button variant="outline" size="sm">
            + Новий розрахунок
          </Button>
        </Link>
      </div>

      {/* Завантаження */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {/* Помилка */}
      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-600">
            Не вдалося завантажити історію. Спробуйте оновити сторінку.
          </p>
        </div>
      )}

      {/* Порожній стан */}
      {!isLoading && !isError && calculations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-3xl">🚗</p>
          <p className="mt-3 font-semibold text-slate-700">
            Ще немає жодного розрахунку
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Зробіть перший розрахунок, і він з'явиться тут
          </p>
          <Link to={routes.calculator} className="mt-5 inline-block">
            <Button size="sm">Розрахувати зараз</Button>
          </Link>
        </div>
      )}

      {/* Список */}
      {!isLoading && calculations.length > 0 && (
        <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}>
          {calculations.map((calc) => (
            <CalculationCard key={calc.id} calculation={calc} />
          ))}
        </div>
      )}

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => goToPage(page - 1)}
          >
            ← Назад
          </Button>

          <span className="px-4 text-sm text-slate-600">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => goToPage(page + 1)}
          >
            Вперед →
          </Button>
        </div>
      )}
    </div>
  );
}
