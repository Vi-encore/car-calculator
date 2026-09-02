import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar/Navbar";
import { Footer } from "../Footer/Footer";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
