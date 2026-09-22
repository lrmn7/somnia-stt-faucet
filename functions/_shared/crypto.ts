export async function hashWithSecret(value: string, secret: string = 'somnia-faucet-default-salt'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${value}:${secret}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
