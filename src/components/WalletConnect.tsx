import { ConnectButton } from "thirdweb/react";
import { SomniaTestnet } from "@/constants/chain";

export function CustomWalletConnectButton() {
  return (
    <ConnectButton
client={{
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  secretKey: process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY || "",
}}
      chain={SomniaTestnet} 
      theme={"dark"}
      connectModal={{
        size: "wide",
        titleIcon: "", 
      }}
      connectButton={{
        label: "Connect Wallet",
        style: {
          backgroundColor: '#F2AC29', // dark.accent
          color: '#0D0D0D', // dark.primary
        }
      }}
    />
  );
}