import { Link } from "react-router-dom";
import { routes } from "../../constants/constantRoute";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-xs py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>🚗</span>
          <span className="font-semibold text-slate-700">CarCalculator</span>
          <span>— сервіс точної оцінки вартості авто</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to={routes.default} className="hover:text-teal-600 transition">
            Головна
          </Link>
          <Link
            to={routes.calculator}
            className="hover:text-teal-600 transition"
          >
            Калькулятор
          </Link>
        </div>

        <div>© {currentYear} CarCalculator. Всі права захищено.</div>
      </div>
    </footer>
  );
}
