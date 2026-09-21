import type { CarListing } from "@car-calculator/types";
import { CarListingRow } from "../CarListingRow/CarListingRow";

interface CarListingsTableProps {
  readonly listings: CarListing[];
  readonly avgPrice: number | null | undefined;
}

export function CarListingsTable({ listings, avgPrice }: CarListingsTableProps) {
  if (listings.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-slate-700">
        Авто, що увійшли до розрахунку ({listings.length})
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 pl-4 pr-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                №
              </th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Фото
              </th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ціна
              </th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Рік
              </th>
              <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Пробіг
              </th>
              <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Джерело
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((car, index) => (
              <CarListingRow
                key={car.id}
                car={car}
                index={index}
                avgPrice={avgPrice}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
