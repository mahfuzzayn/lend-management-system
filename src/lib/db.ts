import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection (requirements NFR-5).
 *
 * One cached connection promise per serverless instance: hot invocations
 * reuse the live connection instead of re-dialing Atlas on every request.
 * The cache hangs off `globalThis` so dev-server HMR cannot stack instances.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { __mongooseCache?: MongooseCache };
const cache: MongooseCache = globalForMongoose.__mongooseCache ?? { conn: null, promise: null };
globalForMongoose.__mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  // Read lazily: importing this module must never break `next build` on a
  // machine without .env (route handlers are imported during build).
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(uri).catch((error: unknown) => {
    // Drop the rejected promise so a later invocation can retry.
    cache.promise = null;
    throw error;
  });

  cache.conn = await cache.promise;
  return cache.conn;
}
