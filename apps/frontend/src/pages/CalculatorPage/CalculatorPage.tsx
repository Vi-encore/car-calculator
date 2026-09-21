import { useCalculatorForm } from "./hooks/useCalculatorForm";
import { ResultCard } from "../../components/ResultCard/ResultCard";
import { CalculatorForm } from "../../components/CalculatorForm/CalculatorForm";

export function CalculatorPage() {
  const { register, handleSubmit, errors, isLoading, result, serverError, onSubmit } =
    useCalculatorForm();

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Калькулятор вартості авто 🚗
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Вкажіть параметри автомобіля та отримайте актуальну ринкову ціну
        </p>
      </div>

      <CalculatorForm
        register={register}
        onSubmit={handleSubmit(onSubmit)}
        errors={errors}
        isLoading={isLoading}
        serverError={serverError}
      />

      {result && <ResultCard result={result} />}
    </div>
  );
}
