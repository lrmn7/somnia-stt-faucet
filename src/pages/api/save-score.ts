import { MongoClient, Db } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// --- Variabel Lingkungan ---
// Membaca URI dan nama DB untuk utama dan cadangan
const primaryUri = process.env.MONGODB_URI;
const primaryDbName = process.env.MONGODB_DB_NAME;
const fallbackUri = process.env.MONGODB_URI_FALLBACK;
const fallbackDbName = process.env.MONGODB_DB_NAME_FALLBACK;

const ownerWallets = (process.env.NEXT_PUBLIC_OWNER_WALLETS || '')
  .toLowerCase()
  .split(',')
  .map(addr => addr.trim());

// --- Skema Validasi Zod ---
const scoreSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  score: z.number().min(0, "Score cannot be negative"),
  questionsCorrect: z.number().min(0),
  questionsAttempted: z.number().min(0)
});

// Cache koneksi untuk beberapa database
const connectionCache = new Map<string, { client: MongoClient, db: Db }>();

// Fungsi koneksi sekarang menerima URI dan nama DB
async function connectToDatabase(uri: string, dbName: string) {
  // Cek cache terlebih dahulu
  if (connectionCache.has(uri)) {
    return connectionCache.get(uri)!;
  }
  
  // Validasi input
  if (!uri) throw new Error('Database URI is not defined in environment variables');
  if (!dbName) throw new Error('Database name is not defined in environment variables');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Simpan koneksi baru ke cache
  const connection = { client, db };
  connectionCache.set(uri, connection);
  
  return connection;
}

// --- Handler API ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Validasi input
  const validation = scoreSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid or missing fields', details: validation.error.flatten() });
  }

  const { address, score, questionsCorrect, questionsAttempted } = validation.data;
  const addressLower = address.toLowerCase();

  // Cek owner wallet
  if (ownerWallets.includes(addressLower)) {
    console.log(`[SKIP SAVE] Wallet ${addressLower} is an owner wallet.`);
    return res.status(200).json({
      message: 'Owner wallet - skipping DB save.',
      completed: true
    });
  }
  
  // --- Coba simpan ke DB Primer dengan Retry ---
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!primaryUri || !primaryDbName) {
          throw new Error("Primary database configuration is missing.");
      }
      const { db } = await connectToDatabase(primaryUri, primaryDbName);
      const collection = db.collection('quizScores');

      const result = await collection.updateOne(
        { address: addressLower },
        {
          $max: { score: score },
          $set: {
            questionsCorrect,
            questionsAttempted,
            updatedAt: new Date()
          },
          $setOnInsert: {
            address: addressLower,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      // Jika berhasil, kirim respons dan hentikan fungsi
      console.log(`Score for ${addressLower} saved to PRIMARY DB on attempt ${attempt}.`);
      return res.status(200).json({
        message: `Score processed successfully on attempt ${attempt}`,
        completed: true,
        storage: 'primary',
        upsertedId: result.upsertedId,
        modifiedCount: result.modifiedCount
      });

    } catch (error: any) {
      lastError = error;
      console.error(`PRIMARY DB Error attempt ${attempt}/${maxRetries}:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // Jika semua percobaan ke DB primer gagal, coba simpan ke DB cadangan
  console.warn(`All attempts to save to primary DB failed. Switching to FALLBACK DB.`);

  // Cek apakah konfigurasi DB cadangan ada
  if (!fallbackUri || !fallbackDbName) {
    console.error('CRITICAL: Fallback DB is not configured. Data could not be saved.');
    return res.status(500).json({ 
        error: 'Failed to save score after multiple attempts and fallback is not configured.', 
        details: lastError?.message 
    });
  }

  try {
    const { db: fallbackDb } = await connectToDatabase(fallbackUri, fallbackDbName);
    const fallbackCollection = fallbackDb.collection('quizScores'); 

    const result = await fallbackCollection.updateOne(
      { address: addressLower },
      {
        $max: { score: score },
        $set: {
          questionsCorrect,
          questionsAttempted,
          updatedAt: new Date()
        },
        $setOnInsert: {
          address: addressLower,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`Score for ${addressLower} successfully saved to FALLBACK DB.`);
    return res.status(200).json({
      message: 'Primary DB failed, but score was saved to fallback storage.',
      completed: true,
      storage: 'fallback',
      upsertedId: result.upsertedId,
      modifiedCount: result.modifiedCount
    });

  } catch (fallbackError: any) {
    console.error('CRITICAL: Failed to save to both primary and fallback databases.');
    console.error('Primary DB final error:', lastError?.message);
    console.error('Fallback DB error:', fallbackError.message);
    return res.status(500).json({
      error: 'Failed to save score to both primary and fallback databases.',
      primaryError: lastError?.message,
      fallbackError: fallbackError.message
    });
  }
}