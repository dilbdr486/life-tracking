import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/lifeflow";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  indexesSynced?: boolean;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  indexesSynced: false,
};

global.mongooseCache = cached;

async function dropIndexIfExists(
  collection: mongoose.mongo.Collection,
  indexName: string,
) {
  try {
    await collection.dropIndex(indexName);
  } catch {}
}

async function syncBudgetIndexes() {
  if (cached.indexesSynced) return;
  const db = mongoose.connection.db;
  if (!db) return;

  await dropIndexIfExists(db.collection("budgets"), "userId_1");
  await dropIndexIfExists(
    db.collection("categorybudgets"),
    "userId_1_category_1",
  );

  const { Budget, CategoryBudget } = await import("@/models");
  await Promise.all([Budget.syncIndexes(), CategoryBudget.syncIndexes()]);
  cached.indexesSynced = true;
}

export async function connectDB() {
  if (cached.conn) {
    await syncBudgetIndexes();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  await syncBudgetIndexes();
  return cached.conn;
}
