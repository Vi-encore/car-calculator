import { Link } from "react-router-dom";
import { routes } from "../../constants/constantRoute";

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Оцініть вартість вашого авто <span className="text-blue-600">швидко та точно</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Наш сервіс допоможе вам дізнатися реальну ринкову ціну автомобіля на основі актуальних даних. 
          Швидкий аналіз, розумні алгоритми та детальна історія ваших розрахунків у вашому особистому кабінеті.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to={routes.register}
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Почати безкоштовно
          </Link>
          <Link to={routes.login} className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
            Вже маєте акаунт? Увійти <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
