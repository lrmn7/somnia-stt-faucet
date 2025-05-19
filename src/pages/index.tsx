import { useState, useEffect, useCallback } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { getContract } from "thirdweb";
import toast from "react-hot-toast";
import {
  ACTIVE_CHAIN,
  THIRDWEB_CLIENT_ID,
  FUN_QUIZ_CONTRACT_ADDRESS,
  THIRDWEB_SECRET_ID,
} from "@/constants/chain";
import questionsData from "@/constants/questions.json";
import { SomniaQuizGameABI } from "@/constants/abi";

import MainLayout from "@/components/layout/MainLayout";
import QuizArea from "@/components/QuizArea"; // Asumsi path ini benar
import GameStartScreen from "@/components/game/GameStartScreen";
import GameOverScreen from "@/components/game/GameOverScreen";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

const GameSmartContractAddress = FUN_QUIZ_CONTRACT_ADDRESS;

export default function HomePage() {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isTxLoading } =
    useSendTransaction();

  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gamePaymentMade, setGamePaymentMade] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  const gameContract = account
    ? getContract({
        client: {
          clientId: THIRDWEB_CLIENT_ID,
          secretKey: THIRDWEB_SECRET_ID,
        },
        chain: ACTIVE_CHAIN,
        address: GameSmartContractAddress,
        abi: SomniaQuizGameABI,
      })
    : null;

  const shuffleQuestions = useCallback((array: Question[]): Question[] => {
    return [...array].sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    if (!gameStarted && !gameFinished) {
      setQuestions(shuffleQuestions(questionsData));
    }
  }, [gameStarted, gameFinished, shuffleQuestions]);

  const handleStartGamePayment = async () => {
    if (!account || !gameContract) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (gamePaymentMade) {
      toast.success("Payment already made for this session. Starting game...");
      setGameStarted(true);
      setGameFinished(false);
      setCurrentScore(0);
      setQuestions(shuffleQuestions(questionsData));
      return;
    }

    toast.loading("Processing payment to start game...", {
      id: "paymentToast",
    });
    try {
      const fee = toWei("0.001");
      const transaction = prepareContractCall({
        contract: gameContract,
        method: "payToStartGame",
        params: [],
        value: BigInt(fee.toString()),
      });

      await sendTransaction(transaction as any, {
        onSuccess: () => {
          toast.dismiss("paymentToast");
          toast.success("Payment successful! Game starting...");
          setGamePaymentMade(true);
          setGameStarted(true);
          setGameFinished(false);
          setCurrentScore(0);
          setQuestions(shuffleQuestions(questionsData));
        },
        onError: (error) => {
          toast.dismiss("paymentToast");
          console.error("Payment failed:", error);
          toast.error(`Payment failed: ${error.message.slice(0, 50)}...`);
          setGamePaymentMade(false);
        },
      });
    } catch (error: any) {
      toast.dismiss("paymentToast");
      console.error("Error preparing transaction:", error);
      toast.error(`Error: ${error.message}`);
      setGamePaymentMade(false);
    }
  };

const handleGameEnd = useCallback(
  async (
    finalScore: number,
    questionsCorrect: number,
    questionsAttempted: number
  ) => {
    setGameStarted(false);
    setGameFinished(true);
    setCurrentScore(finalScore);
    setGamePaymentMade(false);

    if (!account) {
      toast.error("Wallet not connected. Cannot save score.");
      return;
    }
    if (questionsAttempted === 0) {
      toast.error("No questions attempted. Score will not be saved.");
      return;
    }

    setIsSavingScore(true);
    toast.loading("Saving your score...", { id: "saveScoreToast" });

    const maxRetries = 2;
    let attempt = 0;
    let saved = false;

    while (attempt <= maxRetries && !saved) {
      try {
        const response = await fetch("/api/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: account.address,
            score: finalScore,
            questionsCorrect: questionsCorrect,
            questionsAttempted: questionsAttempted,
          }),
        });
        const data = await response.json();

        if (response.ok) {
          toast.dismiss("saveScoreToast");
          toast.success("Score saved successfully!");
          saved = true;
        } else {
          attempt++;
          if (attempt > maxRetries) {
            toast.dismiss("saveScoreToast");
            console.error("Failed to save score:", data.error);
            toast.error(
              `Failed to save score after ${maxRetries + 1} attempts: ${
                data.error || "Unknown error"
              }`
            );
          } else {
            console.warn(
              `Save score attempt ${attempt} failed, retrying...`,
              data.error
            );
          }
        }
      } catch (error: any) {
        attempt++;
        if (attempt > maxRetries) {
          toast.dismiss("saveScoreToast");
          console.error("Error calling save-score API:", error);
          toast.error(
            `Error saving score after ${maxRetries + 1} attempts: ${error.message}`
          );
        } else {
          console.warn(
            `Save score attempt ${attempt} encountered error, retrying...`,
            error
          );
        }
      }
    }

    setIsSavingScore(false);
  },
  [account, shuffleQuestions]
);


  const resetGame = () => {
    setGameStarted(false);
    setGameFinished(false);
    setCurrentScore(0);
    setGamePaymentMade(false);
    setQuestions(shuffleQuestions(questionsData));
  };

  return (
    <MainLayout>
      {!gameStarted && !gameFinished && (
        <GameStartScreen
          onStartPayment={handleStartGamePayment}
          isTxLoading={isTxLoading}
          isWalletConnected={!!account}
          gamePaymentMade={gamePaymentMade}
          walletAddress={account?.address || null}
        />
      )}

      {gameStarted && !gameFinished && questions.length > 0 && (
        <QuizArea
          questions={questions}
          onGameEnd={handleGameEnd}
          totalQuestions={questionsData.length}
        />
      )}

      {gameFinished && (
        <GameOverScreen
          currentScore={currentScore}
          onResetGame={resetGame}
          isSavingScore={isSavingScore}
        />
      )}
    </MainLayout>
  );
}
