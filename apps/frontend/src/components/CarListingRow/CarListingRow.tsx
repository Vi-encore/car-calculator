import type { CarListing } from "@car-calculator/types";
import { formatUSD, formatMileage } from "../../utils/formatters";

interface CarListingRowProps {
  readonly car: CarListing;
  readonly index: number;
  readonly avgPrice: number | null | undefined;
}

export function CarListingRow({ car, index, avgPrice }: CarListingRowProps) {
  const formattedPrice = formatUSD(car.price);
  const formattedMileage = car.mileage ? formatMileage(car.mileage) : "—";

  // source містить справжній URL оголошення лише для реальних (AutoRIA) даних
  const href =
    car.source && /^https?:\/\//i.test(car.source) ? car.source : null;

  const openListing = () => {
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  const diff =
    avgPrice != null
      ? Math.round(((car.price - avgPrice) / avgPrice) * 100)
      : null;

  let diffColorClass = "text-slate-400";
  if (diff != null) {
    if (diff > 0) diffColorClass = "text-red-500";
    else if (diff < 0) diffColorClass = "text-teal-600";
  }

  return (
    <tr
      onClick={href ? openListing : undefined}
      className={`border-t border-slate-100 transition-colors ${
        href ? "cursor-pointer hover:bg-teal-50/60" : "hover:bg-slate-50"
      }`}
    >
      <td className="py-3 pl-4 pr-2 text-sm text-slate-500 w-8">{index + 1}</td>
      <td className="py-3 px-2">
        {car.photoUrl ? (
          <img
            src={car.photoUrl}
            alt="авто"
            className="h-12 w-20 rounded-lg object-cover"
          />
        ) : (
          <div className="h-12 w-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
            немає фото
          </div>
        )}
      </td>
      <td className="py-3 px-2 text-sm font-semibold text-slate-800">
        {formattedPrice}
        {diff != null && (
          <span className={`ml-2 text-xs font-medium ${diffColorClass}`}>
            {diff > 0 ? `+${diff}%` : `${diff}%`}
          </span>
        )}
      </td>
      <td className="py-3 px-2 text-sm text-slate-600">{car.year}</td>
      <td className="py-3 px-2 text-sm text-slate-600">{formattedMileage}</td>
      <td className="py-3 pr-4 text-xs">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 font-medium text-teal-600 hover:underline"
          >
            AUTO.RIA
            <span aria-hidden>↗</span>
          </a>
        ) : (
          <span className="text-slate-400">{car.source ?? "—"}</span>
        )}
      </td>
    </tr>
  );
}
