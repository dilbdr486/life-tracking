export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${
        error
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-teal-500/10 text-teal-700 dark:text-teal-300"
      }`}
    >
      {error ?? success}
    </div>
  );
}
