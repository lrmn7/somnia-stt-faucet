import { MongoClient } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

const uri = process.env.NEXT_PUBLIC_MONGODB_URI;
const dbName = process.env.NEXT_PUBLIC_MONGODB_DB_NAME;

let cachedClient: MongoClient | null = null;
let cachedDb: any | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }
  if (!dbName) {
    throw new Error("Please define the MONGODB_DB_NAME environment variable inside .env.local");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Missing or invalid wallet address" });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("quizScores");
    const player = await collection.findOne({ address: address.toLowerCase() });

    if (player) {
      return res.status(200).json({
        wallet: address.toLowerCase(),
        score: player.score,
        completed: player.score >= 1000, // ✅ misi dianggap selesai kalau score >= 1000
      });
    } else {
      return res.status(200).json({
        wallet: address.toLowerCase(),
        score: 0,
        completed: false,
      });
    }
  } catch (error: any) {
    console.error("MongoDB check completion error:", error);
    return res.status(500).json({ error: error.message || "Failed to check quiz completion" });
  }
}
