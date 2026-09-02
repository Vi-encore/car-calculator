interface LoaderProps {
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
  readonly fullScreen?: boolean;
}

export function Loader({
  size = "md",
  className = "",
  fullScreen = false,
}: Readonly<LoaderProps>) {
  const sizeStyles = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <output
      className={`inline-block animate-spin rounded-full border-teal-600 border-t-transparent ${sizeStyles[size]} ${className}`}
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
