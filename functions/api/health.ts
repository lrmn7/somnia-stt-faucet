import { Env } from '../_shared/types';
import { SOMNIA_SHANNON_CHAIN_ID } from '../_shared/somnia';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  let dbOk = false;
  try {
    const res = await env.DB.prepare('SELECT 1 as alive').first<{ alive: number }>();
    dbOk = res?.alive === 1;
  } catch {
    dbOk = false;
  }

  const isHealthy = dbOk;

  return new Response(
    JSON.stringify({
      ok: isHealthy,
      network: 'Somnia Shannon Testnet',
      chainId: SOMNIA_SHANNON_CHAIN_ID,
      status: isHealthy ? 'healthy' : 'degraded',
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
