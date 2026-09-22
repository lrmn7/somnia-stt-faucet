import { parseEther } from 'viem';

export interface ClaimRecord {
  id: number;
  wallet_hash: string;
  ip_hash: string;
  idempotency_key: string;
  amount_wei: string;
  status: string;
  tx_hash: string | null;
  created_at: number;
  updated_at: number;
  eligible_at: number;
  lock_expires_at: number | null;
  error_code: string | null;
}

export function getUtcDayKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  eligible_at INTEGER NOT NULL,
  lock_expires_at INTEGER,
  error_code TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_idempotency
ON claims(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_claims_wallet_created
ON claims(wallet_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claims_ip_created
ON claims(ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claims_status_created
ON claims(status, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_budget (
  day_key TEXT PRIMARY KEY,
  reserved_wei TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

let isSchemaInitialized = false;

export async function ensureSchema(db: D1Database): Promise<void> {
  if (isSchemaInitialized) return;
  try {
    await db.exec(SCHEMA_SQL);
    isSchemaInitialized = true;
  } catch (err) {
    console.error('[DB] Failed to auto-initialize schema:', err);
    throw err;
  }
}

export async function verifyClaimEligibility(params: {
  db: D1Database;
  walletHash: string;
  ipHash: string;
  idempotencyKey: string;
  claimAmountSTT: string;
  dailyCapSTT: string;
  ipAttemptLimit: number;
  ipWindowSeconds: number;
  maxDailyIpAttempts: number;
}): Promise<{ now: number; eligibleAt: number; lockExpiresAt: number; claimAmountWei: string }> {
  await ensureSchema(params.db);
  const now = Math.floor(Date.now() / 1000);
  const claimAmountWei = parseEther(params.claimAmountSTT).toString();

  const existingIdempotency = await params.db
    .prepare('SELECT id, status, tx_hash FROM claims WHERE idempotency_key = ?')
    .bind(params.idempotencyKey)
    .first<{ id: number; status: string; tx_hash: string | null }>();

  if (existingIdempotency) {
    if (existingIdempotency.status === 'submitted' || existingIdempotency.status === 'confirmed') {
      const err = new Error('ALREADY_CLAIMED_IDEMPOTENT');
      (err as any).txHash = existingIdempotency.tx_hash;
      throw err;
    }
    if (existingIdempotency.status === 'reserved') {
      throw new Error('CLAIM_IN_PROGRESS');
    }
  }

  const burstWindowStart = now - params.ipWindowSeconds;
  const burstCount = await params.db
    .prepare('SELECT COUNT(*) as cnt FROM claims WHERE ip_hash = ? AND created_at >= ?')
    .bind(params.ipHash, burstWindowStart)
    .first<{ cnt: number }>();

  if ((burstCount?.cnt || 0) >= params.ipAttemptLimit) {
    throw new Error('RATE_LIMITED');
  }

  const dayWindowStart = now - 86400;
  const dailyIpCount = await params.db
    .prepare('SELECT COUNT(*) as cnt FROM claims WHERE ip_hash = ? AND created_at >= ?')
    .bind(params.ipHash, dayWindowStart)
    .first<{ cnt: number }>();

  if ((dailyIpCount?.cnt || 0) >= params.maxDailyIpAttempts) {
    throw new Error('RATE_LIMITED');
  }

  const latestWalletClaim = await params.db
    .prepare(
      'SELECT id, status, eligible_at, lock_expires_at FROM claims WHERE wallet_hash = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(params.walletHash)
    .first<{ id: number; status: string; eligible_at: number; lock_expires_at: number | null }>();

  if (latestWalletClaim) {
    if (
      latestWalletClaim.status === 'reserved' &&
      latestWalletClaim.lock_expires_at &&
      latestWalletClaim.lock_expires_at > now
    ) {
      throw new Error('CLAIM_IN_PROGRESS');
    }

    if (
      (latestWalletClaim.status === 'submitted' || latestWalletClaim.status === 'confirmed') &&
      latestWalletClaim.eligible_at > now
    ) {
      throw new Error('ALREADY_CLAIMED');
    }
  }

  const dayKey = getUtcDayKey();
  const dailyBudget = await params.db
    .prepare('SELECT reserved_wei FROM daily_budget WHERE day_key = ?')
    .bind(dayKey)
    .first<{ reserved_wei: string }>();

  const currentReservedWei = BigInt(dailyBudget?.reserved_wei || '0');
  const maxDailyWei = parseEther(params.dailyCapSTT);
  const requestedWei = BigInt(claimAmountWei);

  if (currentReservedWei + requestedWei > maxDailyWei) {
    throw new Error('DAILY_LIMIT_REACHED');
  }

  const eligibleAt = now + 86400;
  const lockExpiresAt = now + 600;

  return {
    now,
    eligibleAt,
    lockExpiresAt,
    claimAmountWei,
  };
}

export async function reserveClaimInDb(params: {
  db: D1Database;
  walletHash: string;
  ipHash: string;
  idempotencyKey: string;
  amountWei: string;
  now: number;
  eligibleAt: number;
  lockExpiresAt: number;
}): Promise<number> {
  const dayKey = getUtcDayKey();

  const insertClaim = params.db
    .prepare(
      `INSERT INTO claims (
        wallet_hash, ip_hash, idempotency_key, amount_wei,
        status, created_at, updated_at, eligible_at, lock_expires_at
      ) VALUES (?, ?, ?, ?, 'reserved', ?, ?, ?, ?)`
    )
    .bind(
      params.walletHash,
      params.ipHash,
      params.idempotencyKey,
      params.amountWei,
      params.now,
      params.now,
      params.eligibleAt,
      params.lockExpiresAt
    );

  const updateBudget = params.db
    .prepare(
      `INSERT INTO daily_budget (day_key, reserved_wei, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(day_key) DO UPDATE SET
         reserved_wei = CAST(CAST(reserved_wei AS INTEGER) + ? AS TEXT),
         updated_at = ?`
    )
    .bind(dayKey, params.amountWei, params.now, params.amountWei, params.now);

  const results = await params.db.batch([insertClaim, updateBudget]);
  const claimMeta = results[0]?.meta as { last_row_id?: number };
  const claimId = claimMeta?.last_row_id;

  if (!claimId) {
    throw new Error('Failed to acquire claim reservation ID');
  }

  return claimId;
}

export async function markClaimSuccess(params: {
  db: D1Database;
  claimId: number;
  txHash: string;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await params.db
    .prepare(
      `UPDATE claims SET
        status = 'submitted',
        tx_hash = ?,
        updated_at = ?
       WHERE id = ?`
    )
    .bind(params.txHash, now, params.claimId)
    .run();
}

export async function releaseClaimFailure(params: {
  db: D1Database;
  claimId: number;
  amountWei: string;
  errorCode: string;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const dayKey = getUtcDayKey();

  const updateClaim = params.db
    .prepare(
      `UPDATE claims SET
        status = 'failed',
        error_code = ?,
        updated_at = ?,
        lock_expires_at = 0,
        eligible_at = 0
       WHERE id = ?`
    )
    .bind(params.errorCode, now, params.claimId);

  const releaseBudget = params.db
    .prepare(
      `UPDATE daily_budget SET
        reserved_wei = CAST(MAX(0, CAST(reserved_wei AS INTEGER) - ?) AS TEXT),
        updated_at = ?
       WHERE day_key = ?`
    )
    .bind(params.amountWei, now, dayKey);

  await params.db.batch([updateClaim, releaseBudget]);
}

export async function markClaimUnknown(params: {
  db: D1Database;
  claimId: number;
  errorCode: string;
  txHash?: string;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await params.db
    .prepare(
      `UPDATE claims SET
        status = 'unknown',
        tx_hash = ?,
        error_code = ?,
        updated_at = ?
       WHERE id = ?`
    )
    .bind(params.txHash || null, params.errorCode, now, params.claimId)
    .run();
}
