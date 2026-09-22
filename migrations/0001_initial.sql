-- 0001_initial.sql
-- Somnia STT Faucet Persistent Claims and Budget Ledger

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
