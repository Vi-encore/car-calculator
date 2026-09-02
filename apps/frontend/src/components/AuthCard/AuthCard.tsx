import type { ReactNode } from "react";
import { AuthPrompt } from "../AuthPrompt/AuthPrompt";

interface AuthCardProps {
  readonly title: string;
  readonly subtitle: string;
  readonly serverError?: string | null;
  readonly footerText: string;
  readonly footerLinkText: string;
  readonly footerLinkTo: string;
  readonly children: ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  serverError,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}: Readonly<AuthCardProps>) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
            {serverError}
          </div>
        )}

        {children}

        <AuthPrompt
          text={footerText}
          linkText={footerLinkText}
          to={footerLinkTo}
        />
      </div>
    </div>
  );
}
