import { MongoClient } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Variabel lingkungan
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const ownerWallets = (process.env.NEXT_PUBLIC_OWNER_WALLETS || '')
  .toLowerCase()
  .split(',')
  .map(addr => addr.trim());

// Skema validasi dengan Zod
const scoreSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  score: z.number().min(0, "Score cannot be negative"),
  questionsCorrect: z.number().min(0),
  questionsAttempted: z.number().min(0)
});

// Koneksi database dengan caching
let cachedClient: MongoClient | null = null;
let cachedDb: any | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  if (!uri) throw new Error('Please define the MONGODB_URI env variable');
  if (!dbName) throw new Error('Please define the MONGODB_DB_NAME env variable');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// Handler API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Validasi input menggunakan Zod
  const validation = scoreSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid or missing fields', details: validation.error.flatten() });
  }

  const { address, score, questionsCorrect, questionsAttempted } = validation.data;
  const addressLower = address.toLowerCase();

  // Cek jika wallet adalah owner (untuk testing)
  if (ownerWallets.includes(addressLower)) {
    console.log(`[SKIP SAVE] Wallet ${addressLower} is an owner wallet.`);
    return res.status(200).json({
      message: 'Owner wallet - skipping DB save.',
      completed: true
    });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('quizScores');

    // 2. Operasi database atomik dengan $max dan upsert
    const result = await collection.updateOne(
      { address: addressLower },
      {
        // Hanya update 'score' jika nilai baru lebih besar dari yang ada
        $max: { score: score },
        // Selalu update detail attempt terakhir
        $set: {
          questionsCorrect,
          questionsAttempted,
          updatedAt: new Date()
        },
        // Jika dokumen belum ada, atur field ini saat pertama kali dibuat
        $setOnInsert: {
          address: addressLower,
          createdAt: new Date()
        }
      },
      // Opsi untuk membuat dokumen baru jika tidak ditemukan
      { upsert: true }
    );

    return res.status(200).json({
      message: 'Score processed successfully',
      completed: true,
      upsertedId: result.upsertedId,
      modifiedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('MongoDB save score error:', error);
    return res.status(500).json({ error: 'Failed to save score', details: error.message });
  }
}