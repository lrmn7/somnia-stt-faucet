import { useState, useEffect } from "react"; // Impor useEffect
import { ethers } from "ethers";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import {
  FUN_QUIZ_CONTRACT_ADDRESS
} from "@/constants/chain";
import { FunQuizABI } from "@/constants/fun-quiz-abi";
const GameSmartContractAddress = FUN_QUIZ_CONTRACT_ADDRESS;

export default function AdminPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [transferAmount, setTransferAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [contractBalance, setContractBalance] = useState<string | null>(null); // State baru untuk saldo kontrak

  const [loading, setLoading] = useState(false);

  const isWalletConnected = Boolean(account);
  const isFormDisabled = loading || !signer || !contract;

  // Fungsi untuk mengambil dan mengatur saldo kontrak
  const fetchContractBalance = async (currentProvider?: ethers.providers.Web3Provider) => {
    const web3Provider = currentProvider || provider; // Gunakan provider yang baru atau yang sudah ada di state
    if (web3Provider && GameSmartContractAddress) {
      try {
        const balanceBigNumber = await web3Provider.getBalance(GameSmartContractAddress);
        setContractBalance(ethers.utils.formatEther(balanceBigNumber));
      } catch (err: any) {
        console.error("Failed to fetch contract balance:", err);
        toast.error("Failed to fetch contract balance: " + err.message);
        setContractBalance(null);
      }
    }
  };
  useEffect(() => {
    if (provider) {
      fetchContractBalance();
    }
  }, [provider]);

  const connectWallet = async () => {
    // @ts-ignore
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return;
    }

    try {
      // @ts-ignore
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      await ethProvider.send("eth_requestAccounts", []);
      const signerInstance = ethProvider.getSigner();
      const address = await signerInstance.getAddress();
      const contractInstance = new ethers.Contract(GameSmartContractAddress, FunQuizABI, signerInstance);

      setProvider(ethProvider);
      setSigner(signerInstance);
      setAccount(address);
      setContract(contractInstance);

      await fetchContractBalance(ethProvider);

      toast.success("Wallet connected: " + address);
    } catch (err: any) {
      toast.error("Failed to connect wallet: " + err.message);
    }
  };

  const sendNativeToken = async () => {
    if (!signer || !contract || !transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      toast.error("Invalid input or wallet not connected.");
      return;
    }

    setLoading(true);
    toast.loading("Sending tokens...");
    try {
      const tx = await signer.sendTransaction({
        to: GameSmartContractAddress,
        value: ethers.utils.parseEther(transferAmount),
      });
      await tx.wait();

      toast.dismiss();
      toast.success(`Sent ${transferAmount} ETH to contract`);
      setTransferAmount("");
      await fetchContractBalance(); 
    } catch (err: any) {
      toast.dismiss();
      toast.error("Transaction failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawNativeToken = async () => {
    if (!contract || !withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast.error("Invalid input or wallet not connected.");
      return;
    }

    setLoading(true);
    toast.loading("Withdrawing tokens...");
    try {
      const tx = await contract.withdrawPartial(ethers.utils.parseEther(withdrawAmount));
      await tx.wait();

      toast.dismiss();
      toast.success(`Withdrawn ${withdrawAmount} ETH from contract`);
      setWithdrawAmount("");
      await fetchContractBalance();
    } catch (err: any) {
      toast.dismiss();
      toast.error("Withdraw failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      pageTitle="Admin - Transfer & Withdraw"
      pageDescription="Admin panel to send and withdraw native tokens to/from smart contract"
    >
      <div className="py-10">
        <h1 className="text-4xl md:text-6xl font-bold text-dark-accent mb-6 text-center">
          Admin Page
        </h1>

        {!isWalletConnected ? (
          <div className="max-w-md mx-auto">
            <button
              onClick={connectWallet}
              className="w-full bg-dark-accent text-white py-3 rounded-md font-semibold hover:opacity-90 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Informasi Saldo Kontrak */}
            {contractBalance !== null && (
              <div className="max-w-md mx-auto p-4 mb-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded-md text-center">
                <p className="font-bold">Contract Balance (STT):</p>
                <p className="text-2xl">{parseFloat(contractBalance).toFixed(4)} STT</p>
              </div>
            )}

            {(!signer || !contract) && (
              <div className="max-w-md mx-auto p-4 mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
                <p className="font-bold">Attention Required</p>
                <p>
                  {!signer && "Signer not available. "}
                  {!contract && "Contract not initialized properly."}
                </p>
              </div>
            )}

            <div className="max-w-md mx-auto p-6 bg-transparent rounded-lg border border-dark-text-secondary">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3 text-dark-text-secondary">
                  Send Native Token to Contract
                </h2>
                <input
                  type="text"
                  placeholder="Amount in STT"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full border border-dark-text-secondary rounded-md px-3 py-2 mb-3 bg-transparent text-dark-text-secondary font-bold placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-dark-text-secondary"
                  disabled={isFormDisabled}
                />
                <button
                  onClick={sendNativeToken}
                  disabled={isFormDisabled || Number(transferAmount) <= 0}
                  className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-md font-semibold transition"
                >
                  {loading ? "Sending..." : "Send Tokens"}
                </button>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-3 text-dark-text-secondary">
                  Withdraw Native Token from Contract
                </h2>
                <input
                  type="text"
                  placeholder="Amount in STT"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full border border-dark-text-secondary rounded-md px-3 py-2 mb-3 bg-transparent text-dark-text-secondary font-bold placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-dark-text-secondary"
                  disabled={isFormDisabled}
                />
                <button
                  onClick={withdrawNativeToken}
                  disabled={isFormDisabled || Number(withdrawAmount) <= 0}
                  className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-md font-semibold transition"
                >
                  {loading ? "Withdrawing..." : "Withdraw Tokens"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}