import {
  defineChain,
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  getAddress,
  parseEther,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const SOMNIA_SHANNON_CHAIN_ID = 50312;
export const DEFAULT_SOMNIA_RPC = 'https://dream-rpc.somnia.network';
export const EXPLORER_TX_BASE_URL = 'https://shannon-explorer.somnia.network/tx';

export const somniaShannonTestnet = defineChain({
  id: SOMNIA_SHANNON_CHAIN_ID,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [DEFAULT_SOMNIA_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  testnet: true,
});

export function validateAndNormalizeAddress(address: unknown): {
  normalized: string;
  checksummed: `0x${string}`;
} {
  if (typeof address !== 'string' || !address.trim()) {
    throw new Error('Address is required');
  }

  const trimmed = address.trim();
  if (!isAddress(trimmed, { strict: false })) {
    throw new Error('Invalid EVM address format');
  }

  const checksummed = getAddress(trimmed);
  return {
    checksummed,
    normalized: checksummed.toLowerCase(),
  };
}

export async function sendFaucetSTT(params: {
  privateKey: string;
  recipientAddress: `0x${string}`;
  rpcUrl?: string;
  claimAmountSTT?: string;
}): Promise<{ txHash: `0x${string}`; explorerUrl: string }> {
  const rpcUrl = params.rpcUrl || DEFAULT_SOMNIA_RPC;
  const claimAmount = params.claimAmountSTT || '10';
  const claimAmountWei = parseEther(claimAmount);
  const gasSafetyMarginWei = parseEther('0.05');
  const rawKey = params.privateKey.trim();
  const formattedKey: `0x${string}` = rawKey.startsWith('0x')
    ? (rawKey as `0x${string}`)
    : (`0x${rawKey}` as `0x${string}`);

  const account = privateKeyToAccount(formattedKey);

  const publicClient = createPublicClient({
    chain: somniaShannonTestnet,
    transport: http(rpcUrl, { timeout: 15_000 }),
  });

  const remoteChainId = await publicClient.getChainId();
  if (remoteChainId !== SOMNIA_SHANNON_CHAIN_ID) {
    throw new Error(
      `Chain ID mismatch: RPC reported ${remoteChainId}, expected ${SOMNIA_SHANNON_CHAIN_ID} (Somnia Shannon Testnet)`
    );
  }

  const treasuryBalance = await publicClient.getBalance({
    address: account.address,
  });

  const requiredWei = claimAmountWei + gasSafetyMarginWei;
  if (treasuryBalance < requiredWei) {
    console.error(
      `[Faucet] Insufficient treasury balance. Available: ${formatEther(treasuryBalance)} STT, required: ${formatEther(requiredWei)} STT`
    );
    throw new Error('FAUCET_INSUFFICIENT_BALANCE');
  }

  const walletClient = createWalletClient({
    account,
    chain: somniaShannonTestnet,
    transport: http(rpcUrl, { timeout: 20_000 }),
  });

  const txHash = await walletClient.sendTransaction({
    to: params.recipientAddress,
    value: claimAmountWei,
  });

  if (!txHash || !txHash.startsWith('0x')) {
    throw new Error('Invalid transaction hash returned by RPC');
  }

  const explorerUrl = `${EXPLORER_TX_BASE_URL}/${txHash}`;

  return {
    txHash,
    explorerUrl,
  };
}
