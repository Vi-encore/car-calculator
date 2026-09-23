import { Link } from "react-router-dom";
import { routes } from "../../constants/routes";

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-blue-600">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Сторінку не знайдено</h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Вибачте, ми не змогли знайти сторінку, яку ви шукаєте. Можливо, вона була видалена або адреса вказана невірно.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to={routes.default}
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Повернутися на головну сторінку
          </Link>
        </div>
      </div>
    </div>
  );
}
