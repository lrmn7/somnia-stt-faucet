import { Env, ClaimRequestBody, ClaimSuccessResponse, ClaimErrorResponse } from '../_shared/types';
import { hashWithSecret } from '../_shared/crypto';
import { verifyTurnstileToken } from '../_shared/turnstile';
import {
  validateAndNormalizeAddress,
  sendFaucetSTT,
  EXPLORER_TX_BASE_URL,
} from '../_shared/somnia';
import {
  verifyClaimEligibility,
  reserveClaimInDb,
  markClaimSuccess,
  releaseClaimFailure,
  markClaimUnknown,
} from '../_shared/db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'INVALID_REQUEST', message: 'Content-Type must be application/json' },
      400
    );
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10_240) {
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'PAYLOAD_TOO_LARGE', message: 'Request payload exceeds limit' },
      413
    );
  }

  let body: ClaimRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'INVALID_REQUEST', message: 'Malformed JSON payload' },
      400
    );
  }

  let addressInfo: { checksummed: `0x${string}`; normalized: string };
  try {
    addressInfo = validateAndNormalizeAddress(body.walletAddress);
  } catch {
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'INVALID_ADDRESS', message: 'Enter a valid wallet address.' },
      400
    );
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  const turnstileOutcome = await verifyTurnstileToken(
    body.turnstileToken || '',
    turnstileSecret,
    clientIp
  );

  if (!turnstileOutcome.success) {
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'VERIFICATION_FAILED', message: 'Verification failed. Please try again.' },
      403
    );
  }

  const ipHashSecret = env.IP_HASH_SECRET || 'somnia-faucet-ip-salt-2026';
  const walletHashSecret = env.WALLET_HASH_SECRET || 'somnia-faucet-wallet-salt-2026';

  const [ipHash, walletHash] = await Promise.all([
    hashWithSecret(clientIp, ipHashSecret),
    hashWithSecret(addressInfo.normalized, walletHashSecret),
  ]);

  const idempotencyKey =
    body.idempotencyKey && body.idempotencyKey.trim() !== ''
      ? body.idempotencyKey.trim().slice(0, 64)
      : `${walletHash}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const claimAmountSTT = env.CLAIM_AMOUNT_STT || '10';
  const dailyCapSTT = env.DAILY_FAUCET_CAP_STT || '1000';
  const ipAttemptLimit = parseInt(env.IP_ATTEMPT_LIMIT || '5', 10);
  const ipWindowSeconds = parseInt(env.IP_ATTEMPT_WINDOW_SECONDS || '600', 10);
  const maxDailyIpAttempts = parseInt(env.MAX_DAILY_IP_ATTEMPTS || '20', 10);

  let eligibility: {
    now: number;
    eligibleAt: number;
    lockExpiresAt: number;
    claimAmountWei: string;
  };

  try {
    eligibility = await verifyClaimEligibility({
      db: env.DB,
      walletHash,
      ipHash,
      idempotencyKey,
      claimAmountSTT,
      dailyCapSTT,
      ipAttemptLimit,
      ipWindowSeconds,
      maxDailyIpAttempts,
    });
  } catch (err: any) {
    if (err?.message === 'ALREADY_CLAIMED_IDEMPOTENT') {
      const txHash = err.txHash || '0x';
      return jsonResponse<ClaimSuccessResponse>({
        ok: true,
        amount: claimAmountSTT,
        txHash,
        explorerUrl: `${EXPLORER_TX_BASE_URL}/${txHash}`,
      });
    }

    if (err?.message === 'ALREADY_CLAIMED') {
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'ALREADY_CLAIMED', message: 'You already claimed your 10 STT. Try again later.' },
        409
      );
    }

    if (err?.message === 'CLAIM_IN_PROGRESS') {
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'CLAIM_IN_PROGRESS', message: 'A claim is currently being processed for this wallet. Please wait.' },
        409
      );
    }

    if (err?.message === 'RATE_LIMITED') {
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
        429
      );
    }

    if (err?.message === 'DAILY_LIMIT_REACHED') {
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'DAILY_LIMIT_REACHED', message: 'The daily faucet limit has been reached. Please check back tomorrow.' },
        429
      );
    }

    console.error('[Claim] Eligibility check error:', err);
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'FAUCET_UNAVAILABLE', message: 'The faucet is temporarily unavailable. Please try again later.' },
      503
    );
  }

  let claimId: number;
  try {
    claimId = await reserveClaimInDb({
      db: env.DB,
      walletHash,
      ipHash,
      idempotencyKey,
      amountWei: eligibility.claimAmountWei,
      now: eligibility.now,
      eligibleAt: eligibility.eligibleAt,
      lockExpiresAt: eligibility.lockExpiresAt,
    });
  } catch (err) {
    console.error('[Claim] Atomic reservation error:', err);
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'CLAIM_IN_PROGRESS', message: 'Unable to reserve claim lock. Please try again.' },
      409
    );
  }

  const privateKey = env.FAUCET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('[Claim] FAUCET_PRIVATE_KEY secret is not configured.');
    await releaseClaimFailure({
      db: env.DB,
      claimId,
      amountWei: eligibility.claimAmountWei,
      errorCode: 'FAUCET_PRIVATE_KEY_MISSING',
    });
    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'FAUCET_UNAVAILABLE', message: 'The faucet is temporarily unavailable. Please try again later.' },
      503
    );
  }

  try {
    const txResult = await sendFaucetSTT({
      privateKey,
      recipientAddress: addressInfo.checksummed,
      rpcUrl: env.SOMNIA_RPC_URL,
      claimAmountSTT,
    });

    await markClaimSuccess({
      db: env.DB,
      claimId,
      txHash: txResult.txHash,
    });

    return jsonResponse<ClaimSuccessResponse>({
      ok: true,
      amount: claimAmountSTT,
      txHash: txResult.txHash,
      explorerUrl: txResult.explorerUrl,
    });
  } catch (err: any) {
    console.error('[Claim] Transaction error:', err?.message || err);

    if (err?.message === 'FAUCET_INSUFFICIENT_BALANCE') {
      await releaseClaimFailure({
        db: env.DB,
        claimId,
        amountWei: eligibility.claimAmountWei,
        errorCode: 'INSUFFICIENT_TREASURY_BALANCE',
      });
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'FAUCET_UNAVAILABLE', message: 'The faucet is temporarily unavailable. Please try again later.' },
        503
      );
    }

    if (err?.message?.includes('Chain ID mismatch')) {
      await releaseClaimFailure({
        db: env.DB,
        claimId,
        amountWei: eligibility.claimAmountWei,
        errorCode: 'CHAIN_ID_MISMATCH',
      });
      return jsonResponse<ClaimErrorResponse>(
        { ok: false, code: 'FAUCET_UNAVAILABLE', message: 'The faucet is temporarily unavailable. Please try again later.' },
        503
      );
    }

    await markClaimUnknown({
      db: env.DB,
      claimId,
      errorCode: err?.code || 'TX_EXECUTION_ERROR',
    });

    return jsonResponse<ClaimErrorResponse>(
      { ok: false, code: 'TRANSACTION_FAILED', message: 'The faucet could not complete the transfer. Try again later.' },
      502
    );
  }
};

export const onRequestGet: PagesFunction = async () => {
  return jsonResponse<ClaimErrorResponse>(
    { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Use POST to request STT' },
    405
  );
};

function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
