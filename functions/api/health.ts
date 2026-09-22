import { Env } from '../_shared/types';
import { SOMNIA_SHANNON_CHAIN_ID } from '../_shared/somnia';
import { ensureSchema } from '../_shared/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  let dbOk = false;
  let tablesOk = false;
  let dbError: string | null = null;
  try {
    if (env.DB) {
      await ensureSchema(env.DB);
    }
    const res = await env.DB.prepare('SELECT 1 as alive').first<{ alive: number }>();
    dbOk = res?.alive === 1;

    const tableRes = await env.DB.prepare('SELECT COUNT(*) as count FROM claims').first<{ count: number }>();
    tablesOk = typeof tableRes?.count === 'number';
  } catch (err: any) {
    dbError = err?.message || 'Database query error';
  }

  const hasPrivateKey = Boolean(env.FAUCET_PRIVATE_KEY && env.FAUCET_PRIVATE_KEY.trim() !== '');
  const hasTurnstileSecret = Boolean(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SECRET_KEY.trim() !== '');

  const isHealthy = dbOk && tablesOk && hasPrivateKey && hasTurnstileSecret;

  return new Response(
    JSON.stringify({
      ok: isHealthy,
      status: isHealthy ? 'healthy' : 'misconfigured',
      checks: {
        database_connected: dbOk,
        tables_created: tablesOk,
        faucet_private_key_set: hasPrivateKey,
        turnstile_secret_set: hasTurnstileSecret,
      },
      error: dbError,
      network: 'Somnia Shannon Testnet',
      chainId: SOMNIA_SHANNON_CHAIN_ID,
      timestamp: Math.floor(Date.now() / 1000),
    }),
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
      },
    }
  );
};
