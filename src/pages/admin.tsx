import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import { prepareContractCall, toWei, getContract } from "thirdweb"; // Import thirdweb utilities
import { SendTransactionOptions } from "thirdweb/react"; // Import for typing

import { ACTIVE_CHAIN, THIRDWEB_CLIENT_ID, THIRDWEB_SECRET_ID } from "@/constants/chain";
import { SomniaQuizGameABI } from "@/constants/abi"; // Assuming your ABI is correctly imported

interface AdminPageProps {
  account: string;
  gameContract: ReturnType<typeof getContract> | null; // Thirdweb contract type
  sendTransaction: (transaction: any, options?: SendTransactionOptions) => Promise<void>; // Thirdweb sendTransaction type
  isTxLoading: boolean;
}

export default function AdminPage({
  account,
  gameContract,
  sendTransaction,
  isTxLoading,
}: AdminPageProps) {
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // Function to send native token to contract
  const sendNativeToken = async () => {
    if (!gameContract || !account) {
      toast.error("Wallet not connected or contract not initialized!");
      return;
    }
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      toast.error("Invalid transfer amount!");
      return;
    }

    toast.loading("Sending tokens...", { id: "sendToast" });

    try {
      const amountInWei = toWei(transferAmount);
      const transaction = prepareContractCall({
        contract: gameContract,
        method: "payToStartGame", // Re-using payToStartGame method as a general transfer mechanism if applicable, or rename to a generic deposit method in your contract if it exists.
        params: [],
        value: BigInt(amountInWei.toString()),
      });

      await sendTransaction(transaction, {
        onSuccess: () => {
          toast.dismiss("sendToast");
          toast.success(`Sent ${transferAmount} ETH to contract`);
          setTransferAmount("");
        },
        onError: (error: any) => {
          toast.dismiss("sendToast");
          console.error("Transaction failed:", error);
          toast.error(`Transaction failed: ${error.message.slice(0, 50)}...`);
        },
      });
    } catch (err: any) {
      toast.dismiss("sendToast");
      console.error("Error preparing transaction:", err);
      toast.error("Error: " + err.message);
    }
  };

  // Function to withdraw native token from contract
  const withdrawNativeToken = async () => {
    if (!gameContract || !account) {
      toast.error("Wallet not connected or contract not initialized!");
      return;
    }
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast.error("Invalid withdraw amount!");
      return;
    }

    toast.loading("Withdrawing tokens...", { id: "withdrawToast" });

    try {
      const amountInWei = toWei(withdrawAmount);
      const transaction = prepareContractCall({
        contract: gameContract,
        method: "withdraw", // Assuming your contract has a 'withdraw' method
        params: [account, BigInt(amountInWei.toString())], // Pass the recipient and amount if your withdraw function expects them
      });

      await sendTransaction(transaction, {
        onSuccess: () => {
          toast.dismiss("withdrawToast");
          toast.success(`Withdrawn ${withdrawAmount} ETH from contract`);
          setWithdrawAmount("");
        },
        onError: (error: any) => {
          toast.dismiss("withdrawToast");
          console.error("Withdraw failed:", error);
          toast.error(`Withdraw failed: ${error.message.slice(0, 50)}...`);
        },
      });
    } catch (err: any) {
      toast.dismiss("withdrawToast");
      console.error("Error preparing transaction:", err);
      toast.error("Error: " + err.message);
    }
  };

  return (
    <MainLayout
      pageTitle="Admin - Transfer & Withdraw"
      pageDescription="Admin panel to send and withdraw native tokens to/from smart contract"
    >
      <h1 className="text-4xl md:text-6xl font-bold text-dark-accent mb-6">
        Admin Page
      </h1>
      <div className="max-w-md mx-auto p-6 bg-transparent rounded-lg border border-dark-secondary">
        {/* Transfer native token to contract */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-dark-text-secondary">Send Native Token to Contract</h2>
          <input
            type="text"
            placeholder="Amount in ETH"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full border border-dark-secondary rounded-md px-3 py-2 mb-3 bg-transparent text-dark-text-secondary font-bold placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-dark-accent"
          />
          <button
            onClick={sendNativeToken}
            disabled={isTxLoading}
            className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-md font-semibold transition"
          >
            Send Tokens
          </button>
        </div>

        {/* Withdraw native token from contract */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-dark-text-secondary">Withdraw Native Token from Contract</h2>
          <input
            type="text"
            placeholder="Amount in ETH"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full border border-dark-secondary rounded-md px-3 py-2 mb-3 bg-transparent text-dark-text-secondary font-bold placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-dark-accent"
          />
          <button
            onClick={withdrawNativeToken}
            disabled={isTxLoading}
            className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-md font-semibold transition"
          >
            Withdraw Tokens
          </button>
        </div>
      </div>
    </MainLayout>
  );
}