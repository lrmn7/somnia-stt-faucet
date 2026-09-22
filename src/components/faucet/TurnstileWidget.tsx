import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: (errorCode: string) => void;
  siteKey?: string;
}

const DEFAULT_TEST_SITEKEY = '1x00000000000000000000AA';

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onExpire, onError, siteKey }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const activeSiteKey =
      siteKey ||
      import.meta.env.VITE_TURNSTILE_SITE_KEY ||
      DEFAULT_TEST_SITEKEY;

    const resetWidget = () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.warn('[Turnstile] Error resetting widget:', e);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      reset: resetWidget,
    }));

    useEffect(() => {
      let isMounted = true;
      let intervalId: any = null;

      const initTurnstile = () => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: activeSiteKey,
            theme: 'dark',
            size: 'normal',
            callback: (token: string) => {
              if (isMounted) {
                onSuccessRef.current(token);
              }
            },
            'expired-callback': () => {
              if (isMounted && onExpireRef.current) {
                onExpireRef.current();
              }
            },
            'error-callback': (err: string) => {
              if (isMounted && onErrorRef.current) {
                onErrorRef.current(err);
              }
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('[Turnstile] Render error:', err);
        }
      };

      if (window.turnstile) {
        initTurnstile();
      } else {
        intervalId = setInterval(() => {
          if (window.turnstile) {
            clearInterval(intervalId);
            initTurnstile();
          }
        }, 150);
      }

      return () => {
        isMounted = false;
        if (intervalId) clearInterval(intervalId);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // ignore cleanup errors on fast unmount
          }
          widgetIdRef.current = null;
        }
      };
    }, [activeSiteKey]);

    return (
      <div className="flex flex-col items-center justify-center my-1 min-h-[68px]">
        <div ref={containerRef} className="cf-turnstile" />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
