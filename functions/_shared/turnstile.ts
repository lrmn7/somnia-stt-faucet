export async function verifyTurnstileToken(
  token: string,
  secretKey: string | undefined,
  remoteIp?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
  if (!secretKey) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY is not configured.');
    return { success: false, errorCodes: ['missing-secret-key'] };
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error(`[Turnstile] Siteverify HTTP error: ${response.status}`);
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const outcome = (await response.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    return {
      success: outcome.success === true,
      errorCodes: outcome['error-codes'],
    };
  } catch (err) {
    console.error('[Turnstile] Exception validating token:', err);
    return { success: false, errorCodes: ['siteverify-network-error'] };
  }
}
