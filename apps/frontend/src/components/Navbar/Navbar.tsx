import { NavLogo } from "./components/NavLogo/NavLogo";
import { NavLinks } from "./components/NavLinks/NavLinks";
import { NavAuth } from "./components/NavAuth/NavAuth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLogo />
        <NavLinks />
        <NavAuth />
      </div>
    </header>
  );
}
