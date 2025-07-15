import { MongoClient, Db } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

// Membaca URI dan nama DB untuk utama dan cadangan
const primaryUri = process.env.MONGODB_URI;
const primaryDbName = process.env.MONGODB_DB_NAME;
const fallbackUri = process.env.MONGODB_URI_FALLBACK;
const fallbackDbName = process.env.MONGODB_DB_NAME_FALLBACK;

// Cache koneksi untuk beberapa database
const connectionCache = new Map<string, { client: MongoClient, db: Db }>();

// Fungsi koneksi yang dapat digunakan kembali
async function connectToDatabase(uri: string, dbName: string) {
  if (connectionCache.has(uri)) {
    return connectionCache.get(uri)!;
  }
  
  if (!uri) throw new Error('Database URI is not defined');
  if (!dbName) throw new Error('Database name is not defined');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const connection = { client, db };
  connectionCache.set(uri, connection);
  
  return connection;
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

  const addressLower = address.toLowerCase();

  try {
    // --- Cek di Database Utama ---
    if (!primaryUri || !primaryDbName) {
        throw new Error("Primary database configuration is missing.");
    }
    const { db: primaryDb } = await connectToDatabase(primaryUri, primaryDbName);
    const primaryCollection = primaryDb.collection("quizScores");
    const player = await primaryCollection.findOne({ address: addressLower });

    if (player) {
      console.log(`Player ${addressLower} found in PRIMARY database.`);
      return res.status(200).json({
        wallet: addressLower,
        score: player.score,
        completed: player.score >= 1000,
      });
    }

    // --- Jika tidak ada, cek di Database Cadangan (Fallback) ---
    console.log(`Player ${addressLower} not found in primary. Checking FALLBACK database...`);
    
    if (fallbackUri && fallbackDbName) {
        try {
            const { db: fallbackDb } = await connectToDatabase(fallbackUri, fallbackDbName);
            const fallbackCollection = fallbackDb.collection("quizScores");
            const fallbackPlayer = await fallbackCollection.findOne({ address: addressLower });

            if (fallbackPlayer) {
                console.log(`Player ${addressLower} found in FALLBACK database.`);
                return res.status(200).json({
                    wallet: addressLower,
                    score: fallbackPlayer.score,
                    completed: fallbackPlayer.score >= 1000,
                });
            }
        } catch (fallbackError: any) {
            console.error("Error checking fallback database:", fallbackError.message);
        }
    } else {
        console.warn("Fallback database is not configured.");
    }

    // Jika tidak ditemukan di mana pun, kembalikan data default ---
    console.log(`Player ${addressLower} not found in any database.`);
    return res.status(200).json({
      wallet: addressLower,
      score: 0,
      completed: false,
    });

  } catch (error: any) {
    console.error("API check completion error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to check quiz completion" });
  }
}