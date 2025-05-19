interface GameOverScreenProps {
  currentScore: number;
  onResetGame: () => void;
  isSavingScore: boolean;
}

const GameOverScreen = ({
  currentScore,
  onResetGame,
  isSavingScore,
}: GameOverScreenProps) => {
  return (
    <div className="mt-8 p-6 bg-dark-secondary rounded-lg shadow-xl w-full max-w-xl">
      <h2 className="text-3xl font-bold text-dark-accent mb-4">
        You’ve Reached the End!
      </h2>
      <p className="text-xl mb-2">
        Your final score{" "}
        <span className="font-bold text-dark-accent">{currentScore}</span>{" "}
        Points
      </p>

      <p className="text-md text-dark-text-secondary mb-6">
        {isSavingScore ? (
          "Updating score..."
        ) : (
          <>
            All quizzes are done! <br />
            Check the leaderboard, are you one of the Somnia Legends? <br />
            See you in the next season!
          </>
        )}
      </p>

      <button
        onClick={onResetGame}
        disabled={isSavingScore}
        className="px-6 py-2 bg-dark-accent text-dark-primary font-semibold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 mr-4"
      >
        {isSavingScore ? "Please Wait..." : "Claim Rewards"}
      </button>
    </div>
  );
};

export default GameOverScreen;
