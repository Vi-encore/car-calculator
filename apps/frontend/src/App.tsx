import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl bg-white p-8 shadow-xl text-center border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-800">🚗 Car Calculator</h1>
        <p className="mt-2 text-slate-500">Tailwind CSS успішно підключено!</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-2.5 font-semibold text-white shadow-md shadow-teal-500/20 hover:opacity-95 transition"
        >
          Тестова кнопка
        </button>
      </div>
    </div>
  );
}

// export default App;
