import { defineChain } from "thirdweb/chains";

export const SomniaTestnet = defineChain({
  id: 50312,
  rpc: "https://dream-rpc.somnia.network",
  name: "Somnia Testnet", 
  nativeCurrency: {
    name: "Somnia Testnet",
    symbol: "STT",
    decimals: 18,
  },
  testnet: true,
  slug: "FUN QUIZ - SOMNIA",
});
export const ACTIVE_CHAIN = SomniaTestnet;

export const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
if (!THIRDWEB_CLIENT_ID && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set."
  );
}

export const THIRDWEB_SECRET_ID = process.env.THIRDWEB_SECRET_ID || "";
if (!THIRDWEB_SECRET_ID && typeof window !== "undefined") {
  console.warn(
    "THIRDWEB_SECRET_ID is not set."
  );
}


export const FUN_QUIZ_CONTRACT_ADDRESS = process.env.FUN_QUIZ_CONTRACT_ADDRESS || "";
if (!FUN_QUIZ_CONTRACT_ADDRESS && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_SMART_CONTRACT_ADDRESS is not set."
  );
}