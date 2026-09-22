export interface Env {
  DB: D1Database;
  FAUCET_PRIVATE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  IP_HASH_SECRET?: string;
  WALLET_HASH_SECRET?: string;
  SOMNIA_RPC_URL?: string;
  CLAIM_AMOUNT_STT?: string;
  WALLET_COOLDOWN_SECONDS?: string;
  CLAIM_RESERVATION_TTL_SECONDS?: string;
  DAILY_FAUCET_CAP_STT?: string;
  IP_ATTEMPT_LIMIT?: string;
  IP_ATTEMPT_WINDOW_SECONDS?: string;
  MAX_DAILY_IP_ATTEMPTS?: string;
}

export interface ClaimRequestBody {
  walletAddress?: string;
  turnstileToken?: string;
  idempotencyKey?: string;
}

export interface ClaimSuccessResponse {
  ok: true;
  amount: string;
  txHash: string;
  explorerUrl: string;
}

export interface ClaimErrorResponse {
  ok: false;
  code: string;
  message: string;
}
