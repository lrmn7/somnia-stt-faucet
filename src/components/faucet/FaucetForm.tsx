import React, { useState } from 'react';
import { isAddress } from 'viem';
import { toast } from 'sonner';
import {
  ExternalLink,
  Check,
  Copy,
  Loader2,
  ArrowRight,
  X,
  Wallet,
  Clipboard,
  Zap,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { TurnstileWidget } from './TurnstileWidget';
import { requestClaim } from '../../lib/api';
import { truncateHash } from '../../lib/utils';

export const FaucetForm: React.FC = () => {
  const [address, setAddress] = useState('');
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastTx, setLastTx] = useState<{
    txHash: string;
    explorerUrl: string;
    amount: string;
  } | null>(null);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (showTurnstile) {
      setShowTurnstile(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text.trim());
      }
    } catch {
      // Clipboard access blocked or not supported; user can paste manually
    }
  };

  const handleCopyTx = () => {
    if (lastTx?.txHash) {
      navigator.clipboard.writeText(lastTx.txHash);
      setCopied(true);
      toast.success('Transaction hash copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const executeClaim = async (token: string, targetAddress: string) => {
    setIsLoading(true);

    try {
      const result = await requestClaim({
        walletAddress: targetAddress,
        turnstileToken: token,
      });

      if (result.ok && result.txHash) {
        setLastTx({
          txHash: result.txHash,
          explorerUrl:
            result.explorerUrl ||
            `https://shannon-explorer.somnia.network/tx/${result.txHash}`,
          amount: result.amount || '10',
        });

        toast.success('10 STT sent', {
          description: 'Transaction submitted successfully.',
          action: {
            label: 'View Explorer',
            onClick: () => window.open(result.explorerUrl, '_blank'),
          },
        });

        setAddress('');
      } else {
        toast.error(result.message || 'The faucet could not complete the transfer. Try again later.');
      }
    } catch {
      toast.error('The faucet could not complete the transfer. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      toast.error('Enter a valid wallet address.');
      return;
    }

    if (!isAddress(trimmedAddress, { strict: false })) {
      toast.error('Enter a valid wallet address.');
      return;
    }

    setShowTurnstile(true);
  };

  const handleTurnstileSuccess = (token: string) => {
    const trimmedAddress = address.trim();
    setShowTurnstile(false);

    if (!trimmedAddress || !isAddress(trimmedAddress, { strict: false })) {
      toast.error('Enter a valid wallet address.');
      return;
    }

    executeClaim(token, trimmedAddress);
  };

  const handleTurnstileError = () => {
    setShowTurnstile(false);
    toast.error('Verification failed. Please try again.');
  };

  const handleTurnstileExpire = () => {
    setShowTurnstile(false);
    toast.error('Verification expired. Please try again.');
  };

  const isValidEVM = address.trim() !== '' && isAddress(address.trim(), { strict: false });

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-14 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs font-mono font-medium text-somnia-300 tracking-wide mb-5 select-none backdrop-blur-md animate-fade-in shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span>Somnia Testnet</span>
        <span className="text-white/20">•</span>
        <span className="text-white/60">Shannon</span>
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
        Built with <span className="inline-block whitespace-nowrap"><span className="font-mono text-white font-semibold">&#123;S&#125;</span>omnia</span>
      </h1>
      <p className="text-sm sm:text-base text-somnia-300 max-w-2xl mx-auto mb-8 sm:mb-10 font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:whitespace-nowrap">
        Get 10 STT to test, build, and experiment on <span className="inline-block whitespace-nowrap"><span className="font-mono text-white font-semibold">&#123;S&#125;</span>omnia&nbsp;Network.</span>
      </p>
      <div className="w-full max-w-[500px] relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-3xl blur-xl opacity-40 group-hover:opacity-65 transition duration-500 pointer-events-none" />
        <div className="absolute -inset-px bg-gradient-to-b from-white/20 via-white/5 to-white/0 rounded-2xl pointer-events-none" />
        <div className="relative w-full bg-transparent backdrop-blur-2xl border border-white/[0.18] hover:border-white/[0.28] rounded-2xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 text-left">
          <div className="flex items-center justify-end pb-3.5 mb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Operational</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="wallet-address"
                  className="text-[11px] font-mono font-medium text-somnia-300 tracking-wider uppercase flex items-center gap-1.5"
                >
                  Recipient Wallet
                </label>
                {isValidEVM ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in backdrop-blur-sm">
                    <Check className="w-3 h-3" /> Valid EVM
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-somnia-500">
                    EVM Address
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-somnia-400">
                  <Wallet className="w-4 h-4" />
                </div>

                <input
                  id="wallet-address"
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="0x..."
                  disabled={isLoading || showTurnstile}
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full h-12 pl-10 pr-24 rounded-xl bg-black/30 backdrop-blur-md border border-white/15 text-white placeholder-somnia-400 font-mono text-sm tracking-tight transition-colors duration-150 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-required="true"
                />

                <div className="absolute right-2.5 flex items-center gap-1">
                  {address ? (
                    <button
                      type="button"
                      onClick={() => setAddress('')}
                      className="p-1.5 rounded-lg text-somnia-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Clear address"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 text-somnia-200 hover:text-white border border-white/10 transition-all select-none shadow-sm cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" />
                      Paste
                    </button>
                  )}
                </div>
              </div>
            </div>
            {showTurnstile && (
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/95 border border-white/25 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.08)] animate-fade-in backdrop-blur-2xl">
                <div className="flex items-center justify-between w-full mb-2.5 px-1">
                  <span className="text-xs font-mono text-somnia-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Prove you're human
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTurnstile(false)}
                    className="p-1 rounded text-somnia-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Cancel verification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <TurnstileWidget
                  onSuccess={handleTurnstileSuccess}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || showTurnstile || !address.trim()}
              className={`w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 select-none group/btn ${
                isValidEVM
                  ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.22),0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] hover:bg-[#f0f0f0] active:scale-[0.99] cursor-pointer'
                  : address.trim()
                  ? 'bg-white/90 text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-white active:scale-[0.99] cursor-pointer'
                  : 'bg-white/10 text-somnia-400 border border-white/10 cursor-not-allowed hover:bg-white/10'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Checking your request...</span>
                </>
              ) : showTurnstile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Awaiting verification...</span>
                </>
              ) : (
                <>
                  <span>Claim STT</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-somnia-400 select-none">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-somnia-500" />
              <span>24h Cooldown</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Gas</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-somnia-500" />
              <span>Verified</span>
            </span>
          </div>
          {lastTx && (
            <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-col gap-3 text-left animate-fade-in">
              <div className="flex items-center justify-between text-xs text-somnia-400 font-mono">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  10 STT sent successfully
                </span>
                <span className="text-somnia-500">Shannon Testnet</span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-somnia-950/80 border border-white/10">
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-[11px] font-mono text-somnia-400 uppercase tracking-wider">
                    Transaction Hash
                  </span>
                  <span className="font-mono text-xs text-white truncate font-medium">
                    {truncateHash(lastTx.txHash, 10, 8)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyTx}
                    aria-label="Copy transaction hash"
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-somnia-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={lastTx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open transaction in Shannon explorer"
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-somnia-300 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
