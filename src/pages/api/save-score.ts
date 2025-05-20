// pages/api/save-score.ts
import { MongoClient } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

const uri = process.env.NEXT_PUBLIC_MONGODB_URI;
const dbName = process.env.NEXT_PUBLIC_MONGODB_DB_NAME;

// Ambil daftar wallet owner, dipisahkan dengan koma di .env
const ownerWallets = (process.env.NEXT_PUBLIC_OWNER_WALLETS || '')
  .toLowerCase()
  .split(',')
  .map(addr => addr.trim());

let cachedClient: MongoClient | null = null;
let cachedDb: any | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  if (!dbName) {
    throw new Error('Please define the MONGODB_DB_NAME environment variable inside .env.local');
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { address, score, questionsCorrect, questionsAttempted } = req.body;

  if (!address || typeof score !== 'number' || typeof questionsCorrect !== 'number' || typeof questionsAttempted !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  const addressLower = address.toLowerCase();

  // ✅ Skip penyimpanan jika wallet adalah milik owner
  if (ownerWallets.includes(addressLower)) {
    console.log(`[SKIP SAVE] Wallet ${addressLower} adalah wallet owner (testing mode)`);
    return res.status(200).json({ message: 'Owner wallet - skipping DB save for testing.' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('quizScores');
    const existingScore = await collection.findOne({ address: addressLower });

    let result;
    if (existingScore) {
      if (score > existingScore.score) {
        result = await collection.updateOne(
          { address: addressLower },
          {
            $set: {
              score,
              questionsCorrect,
              questionsAttempted,
              updatedAt: new Date(),
            }
          }
        );
        res.status(200).json({ message: 'Score updated successfully', modifiedCount: result.modifiedCount });
      } else {
        res.status(200).json({ message: 'New score is not higher than existing score', modifiedCount: 0 });
      }
    } else {
      result = await collection.insertOne({
        address: addressLower,
        score,
        questionsCorrect,
        questionsAttempted,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      res.status(201).json({ message: 'New score created successfully', insertedId: result.insertedId });
    }

  } catch (error: any) {
    console.error('MongoDB save score error:', error);
    res.status(500).json({ error: error.message || 'Failed to save score' });
  }
}
