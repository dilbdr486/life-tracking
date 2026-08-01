export const ACTIVITY_CATEGORIES = [
  "Study",
  "Work",
  "Exercise",
  "Sleep",
  "Entertainment",
  "Travel",
  "Family",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
  "Wallet",
  "Other",
] as const;

export const ACTIVITY_COLORS: Record<string, string> = {
  Study: "#0d9488",
  Work: "#2563eb",
  Exercise: "#16a34a",
  Sleep: "#7c3aed",
  Entertainment: "#ea580c",
  Travel: "#0891b2",
  Family: "#db2777",
  Other: "#64748b",
};

export const EXPENSE_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#0ea5e9",
  Shopping: "#a855f7",
  Bills: "#ef4444",
  Entertainment: "#eab308",
  Health: "#22c55e",
  Education: "#3b82f6",
  Other: "#64748b",
};

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
