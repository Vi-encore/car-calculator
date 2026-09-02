import { Link } from "react-router-dom";

interface AuthPromptProps {
  readonly text: string;
  readonly linkText: string;
  readonly to: string;
}

export function AuthPrompt({ text, linkText, to }: Readonly<AuthPromptProps>) {
  return (
    <p className="mt-6 text-center text-xs text-slate-500">
      {text}{" "}
      <Link to={to} className="font-semibold text-teal-600 hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
