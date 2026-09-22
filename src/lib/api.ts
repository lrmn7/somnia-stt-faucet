export interface ClaimResult {
  ok: boolean;
  amount?: string;
  txHash?: string;
  explorerUrl?: string;
  code?: string;
  message?: string;
}

export async function requestClaim(params: {
  walletAddress: string;
  turnstileToken: string;
  idempotencyKey?: string;
}): Promise<ClaimResult> {
  try {
    const response = await fetch('/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: params.walletAddress.trim(),
        turnstileToken: params.turnstileToken,
        idempotencyKey: params.idempotencyKey || `claim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      amount?: string;
      txHash?: string;
      explorerUrl?: string;
      code?: string;
      message?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'The faucet could not complete the transfer. Try again later.',
      };
    }

    return {
      ok: true,
      amount: data.amount || '10',
      txHash: data.txHash,
      explorerUrl: data.explorerUrl,
    };
  } catch (err) {
    console.error('[API] Claim request failed:', err);
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
    };
  }
}
