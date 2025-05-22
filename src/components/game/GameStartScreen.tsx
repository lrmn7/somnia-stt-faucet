import { useEffect, useState } from "react";
import AudioPlayer from '@/components/AudioPlayer';
interface GameStartScreenProps {
  onStartPayment: () => void;
  isTxLoading: boolean;
  isWalletConnected: boolean;
  gamePaymentMade: boolean;
  walletAddress: string | null;
}

const GameStartScreen = ({
  onStartPayment,
  isTxLoading,
  isWalletConnected,
  gamePaymentMade,
  walletAddress,
}: GameStartScreenProps) => {
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState<boolean | null>(
    null
  );
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!isWalletConnected || !walletAddress) {
        setHasCompletedQuiz(null);
        setIsCheckingCompletion(false);
        return;
      }

      setIsCheckingCompletion(true);
      try {
        const response = await fetch(
          `/api/check-quiz-completion?address=${walletAddress}`
        );
        const data = await response.json();

        if (response.ok) {
          setHasCompletedQuiz(data.completed);
        } else {
          console.error("API error:", data.error);
          setHasCompletedQuiz(false);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setHasCompletedQuiz(false);
      } finally {
        setIsCheckingCompletion(false);
      }
    };

    checkCompletionStatus();
  }, [isWalletConnected, walletAddress]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const isButtonDisabled =
    isTxLoading ||
    !isWalletConnected ||
    isCheckingCompletion ||
    hasCompletedQuiz === true;

  const getButtonText = () => {
    if (isCheckingCompletion) return "Checking Status...";
    if (isTxLoading) return "Starting Quiz...";
    if (gamePaymentMade) return "Start Quiz";
    return "Start Quiz";
  };

  return (
    <>
     <AudioPlayer />
      <h4 className="text-gray-400">{greeting}, gSomnia 💛</h4>
      <h1 className="text-4xl md:text-6xl font-bold text-dark-accent mb-4">
        Embark On Your Somnia Journey
      </h1>
      <p className="mb-8 text-lg md:text-xl text-dark-text-secondary">
        Ready to test what you know about the Somnia Network?
      </p>

      {!isWalletConnected && !isCheckingCompletion && (
        <p className="text-xl mt-20 text-yellow-400 animate-bounce">
          Please connect your wallet to start quiz!
        </p>
      )}

      {isWalletConnected && (hasCompletedQuiz === false || gamePaymentMade) && (
        <button
          onClick={onStartPayment}
          disabled={isButtonDisabled}
          className="px-8 py-3 bg-dark-accent text-dark-primary font-bold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
        >
          {getButtonText()}
        </button>
      )}

      {isWalletConnected &&
        !isCheckingCompletion &&
        hasCompletedQuiz === true && (
          <p className="text-xl mt-20 text-yellow-400 animate-bounce text-center">
            You’ve successfully finished the quiz for this season. <br />
            More quizzes are coming soon!
          </p>
        )}
    </>
  );
};

export default GameStartScreen;
