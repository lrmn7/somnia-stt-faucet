import { MongoClient, Db, ObjectId, WithId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

interface QuizScore {
  _id: ObjectId;
  address: string;
  score: number;
  questionsCorrect: number;
  questionsAttempted: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaderboardEntry {
  _id: string;
  address: string;
  score: number;
  questionsCorrect: number;
  questionsAttempted: number;
  timestamp: string;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }
  if (!dbName) {
    throw new Error(
      "Please define the MONGODB_DB_NAME environment variable inside .env.local"
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db: Db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<QuizScore>("quizScores");
    const topScores: WithId<QuizScore>[] = await collection
      .find({})
      .sort({ score: -1, createdAt: 1 })
      .limit(20)
      .toArray();
    const result: LeaderboardEntry[] = topScores.map((doc) => ({
      address: doc.address,
      score: doc.score,
      questionsCorrect: doc.questionsCorrect,
      questionsAttempted: doc.questionsAttempted,
      timestamp: doc.updatedAt
        ? doc.updatedAt.toISOString()
        : doc.createdAt
        ? doc.createdAt.toISOString()
        : new Date().toISOString(),
      _id: doc._id.toString(),
    }));

    res.status(200).json(result);
  } catch (error: any) {
    console.error("MongoDB leaderboard fetch error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch leaderboard" });
  }
}
