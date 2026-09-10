import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    image: { type: String, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    notes: { type: String, default: null },
  },
  { timestamps: true },
);

activitySchema.index({ userId: 1, date: 1 });

const expenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    note: { type: String, default: null },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

expenseSchema.index({ userId: 1, date: 1 });

const budgetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    monthlyIncome: { type: Number, default: 0 },
    monthlyBudget: { type: Number, default: 0 },
    savingsGoal: { type: Number, default: 0 },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const categoryBudgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    category: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categoryBudgetSchema.index(
  { userId: 1, year: 1, month: 1, category: 1 },
  { unique: true },
);
const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    target: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    unit: { type: String, default: "$" },
    deadline: { type: Date, default: null },
  },
  { timestamps: true },
);

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1 });

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ActivityDoc = InferSchemaType<typeof activitySchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ExpenseDoc = InferSchemaType<typeof expenseSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type BudgetDoc = InferSchemaType<typeof budgetSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type CategoryBudgetDoc = InferSchemaType<typeof categoryBudgetSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type GoalDoc = InferSchemaType<typeof goalSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDoc> =
  mongoose.models.User ?? mongoose.model<UserDoc>("User", userSchema);

export const Activity: Model<ActivityDoc> =
  mongoose.models.Activity ??
  mongoose.model<ActivityDoc>("Activity", activitySchema);

export const Expense: Model<ExpenseDoc> =
  mongoose.models.Expense ??
  mongoose.model<ExpenseDoc>("Expense", expenseSchema);

export const Budget: Model<BudgetDoc> =
  mongoose.models.Budget ?? mongoose.model<BudgetDoc>("Budget", budgetSchema);

export const CategoryBudget: Model<CategoryBudgetDoc> =
  mongoose.models.CategoryBudget ??
  mongoose.model<CategoryBudgetDoc>("CategoryBudget", categoryBudgetSchema);

export const Goal: Model<GoalDoc> =
  mongoose.models.Goal ?? mongoose.model<GoalDoc>("Goal", goalSchema);

export const Notification: Model<NotificationDoc> =
  mongoose.models.Notification ??
  mongoose.model<NotificationDoc>("Notification", notificationSchema);
