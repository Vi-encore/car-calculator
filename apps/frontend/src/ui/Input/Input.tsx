import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { EyeIcon } from "../EyeIcon/EyeIcon";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = "text", className = "", id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || props.name;
    const isPasswordType = type === "password";
    const currentType = isPasswordType && showPassword ? "text" : type;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            type={currentType}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 transition outline-none placeholder:text-slate-400
              ${isPasswordType ? "pr-10" : ""}
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              } ${className}`}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer transition p-1"
            >
              <EyeIcon isOpen={showPassword} />
            </button>
          )}
        </div>

        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
