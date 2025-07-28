import mongoose from "mongoose";

const MONGODB_URI = `mongodb://darksquadyt35:Babul%40123%4033@ac-i2emmmf-shard-00-00.iresf3t.mongodb.net:27017/option-chain-data?ssl=true&replicaSet=atlas-19rcsa-shard-0&authSource=admin&retryWrites=true&w=majority`;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectToMongo() {
   if (mongoose.connection.readyState === 1) return;
  if (cached.conn) {
    console.log("✅ MongoDB already connected!");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("⏳ Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((m) => {
        console.log("✅ MongoDB connected successfully!");
        return m;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
