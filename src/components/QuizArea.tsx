import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Question } from "@/pages/index";

interface QuizAreaProps {
  questions: Question[];
  onGameEnd: (
    finalScore: number,
    questionsCorrect: number,
    questionsAttempted: number
  ) => void;
  totalQuestions: number;
}

const TIME_LIMIT_SECONDS = 10;
const INTERSTITIAL_COUNTDOWN_SECONDS = 3;

const shuffleQuestions = (array: Question[]): Question[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function QuizArea({
  questions,
  onGameEnd,
  totalQuestions,
}: QuizAreaProps) {
  const [availableQuestionsThisSession, setAvailableQuestionsThisSession] =
    useState<Question[]>([]);
  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<number>>(
    new Set<number>()
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(
    null
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [
    questionsAttemptedThisSessionCount,
    setQuestionsAttemptedThisSessionCount,
  ] = useState(0);
  const [
    questionsCorrectThisSessionCount,
    setQuestionsCorrectThisSessionCount,
  ] = useState(0);
  const [initialSessionQuestionCount, setInitialSessionQuestionCount] =
    useState(0);
  const [noNewQuestionsAvailable, setNoNewQuestionsAvailable] = useState(false);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
  const [countdown, setCountdown] = useState(INTERSTITIAL_COUNTDOWN_SECONDS);
  const [pointsFromLastQuestion, setPointsFromLastQuestion] = useState<
    number | null
  >(null);

  const currentQuestion = availableQuestionsThisSession[currentQuestionIndex];
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const questionsNotYetMastered = questions.filter(
      (q) => !correctlyAnsweredIds.has(q.id)
    );

    if (
      questions.length > 0 &&
      questionsNotYetMastered.length === 0 &&
      correctlyAnsweredIds.size === totalQuestions
    ) {
      setNoNewQuestionsAvailable(true);
      setAvailableQuestionsThisSession([]);
      setInitialSessionQuestionCount(0);
      return;
    }

    if (questions.length > 0 && questionsNotYetMastered.length === 0) {
      setNoNewQuestionsAvailable(true);
      setAvailableQuestionsThisSession([]);
      setInitialSessionQuestionCount(0);
      return;
    }

    setNoNewQuestionsAvailable(false);
    const shuffledSessionQuestions = shuffleQuestions(questionsNotYetMastered);
    setAvailableQuestionsThisSession(shuffledSessionQuestions);
    setInitialSessionQuestionCount(shuffledSessionQuestions.length);

    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setSelectedAnswer(null);
    setAnsweredCorrectly(null);
    setShowFeedback(false);
    setQuestionsAttemptedThisSessionCount(0);
    setQuestionsCorrectThisSessionCount(0);
    setIsLoadingNextQuestion(false);
  }, [questions, totalQuestions]);

  useEffect(() => {
    if (
      !currentQuestion ||
      showFeedback ||
      isLoadingNextQuestion ||
      noNewQuestionsAvailable
    ) {
      return;
    }

    if (timeLeft === 0) {
      toast.error("Time's up for this question!", { duration: 1500 });

      const updatedAttemptCount = questionsAttemptedThisSessionCount + 1;
      setQuestionsAttemptedThisSessionCount(updatedAttemptCount);
      setPointsFromLastQuestion(0);
      setShowFeedback(true);
      setAnsweredCorrectly(false); 

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false);
        const isLastQuestionOfSession =
          currentQuestionIndex + 1 >= availableQuestionsThisSession.length;

        if (isLastQuestionOfSession) {
          onGameEnd(
            score,
            questionsCorrectThisSessionCount,
            updatedAttemptCount
          );
        } else {
          setIsLoadingNextQuestion(true);
          setCountdown(INTERSTITIAL_COUNTDOWN_SECONDS);
        }
      }, 1500);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    timeLeft,
    currentQuestion,
    showFeedback,
    isLoadingNextQuestion,
    noNewQuestionsAvailable,
    score,
    questionsCorrectThisSessionCount,
    questionsAttemptedThisSessionCount,
    availableQuestionsThisSession.length,
    currentQuestionIndex,
    onGameEnd,
  ]);

  useEffect(() => {
    if (isLoadingNextQuestion) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      if (countdown > 0) {
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        setIsLoadingNextQuestion(false);
        handleNextQuestionLogic();
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isLoadingNextQuestion, countdown]);

  const handleAnswer = (answer: string) => {
    if (
      selectedAnswer ||
      !currentQuestion ||
      isLoadingNextQuestion ||
      showFeedback
    )
      return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    let finalScore = score;
    let finalCorrectCount = questionsCorrectThisSessionCount;
    const finalAttemptCount = questionsAttemptedThisSessionCount + 1;

    setQuestionsAttemptedThisSessionCount(finalAttemptCount);

    const isCorrect = answer === currentQuestion.correctAnswer;
    setAnsweredCorrectly(isCorrect);
    let pointsEarned = 0;

    if (isCorrect) {
      pointsEarned = Math.max(
        10,
        Math.round(currentQuestion.points * (timeLeft / TIME_LIMIT_SECONDS))
      );
      finalScore += pointsEarned;
      setScore(finalScore);

      setCorrectlyAnsweredIds((prev) => new Set(prev).add(currentQuestion.id));

      finalCorrectCount += 1; 
      setQuestionsCorrectThisSessionCount(finalCorrectCount);
      toast.success(`Nice! +${pointsEarned} points`, { duration: 1500 });
    } else {
      toast.error("Wrong answer.", { duration: 1500 });
    }
    setPointsFromLastQuestion(pointsEarned);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      setAnsweredCorrectly(null);

      const isLastQuestionOfSession =
        currentQuestionIndex + 1 >= availableQuestionsThisSession.length;

      if (isLastQuestionOfSession) {
        onGameEnd(finalScore, finalCorrectCount, finalAttemptCount);
      } else {
        setIsLoadingNextQuestion(true);
        setCountdown(INTERSTITIAL_COUNTDOWN_SECONDS);
      }
    }, 1500);
  };

  const handleNextQuestionLogic = () => {
    setTimeLeft(TIME_LIMIT_SECONDS);
    setPointsFromLastQuestion(null);

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= availableQuestionsThisSession.length) {
      if (correctlyAnsweredIds.size === totalQuestions && totalQuestions > 0) {
        setNoNewQuestionsAvailable(true);
      }
    } else {
      setCurrentQuestionIndex(nextIdx);
    }
  };

  if (
    noNewQuestionsAvailable &&
    !isLoadingNextQuestion &&
    totalQuestions > 0 &&
    correctlyAnsweredIds.size === totalQuestions
  ) {
    return (
      <div className="text-center p-10 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-green-400 mb-4">
          🎉 You’ve Mastered All the Questions! 🎉
        </h2>
        <p className="text-lg text-gray-300 mb-6">
          Congratulations! You have answered all the available questions
          correctly. Currently, there are no new questions.
        </p>
        <p className="text-md text-gray-400">Please come back later!</p>
      </div>
    );
  }

  if (questions.length === 0 && !isLoadingNextQuestion) {
    return (
      <div className="text-center p-10 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4">
          No Questions Available
        </h2>
        <p className="text-lg text-gray-300">
          No questions have been configured for this quiz yet.
        </p>
      </div>
    );
  }

  if (
    !isLoadingNextQuestion &&
    (availableQuestionsThisSession.length === 0 || !currentQuestion) &&
    !(
      noNewQuestionsAvailable &&
      correctlyAnsweredIds.size === totalQuestions &&
      totalQuestions > 0
    ) 
  ) {
    if (initialSessionQuestionCount === 0 && !noNewQuestionsAvailable) {
      return (
        <div className="text-center p-10 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Quiz Session Completed
          </h2>
          <p className="text-lg text-gray-300">
            There are no more questions available for this session, or you’ve
            already answered all the ones you needed to review.
          </p>
        </div>
      );
    }
    return (
      <div className="text-center p-10 text-xl text-gray-400">
        loading question or the quiz session has ended...
      </div>
    );
  }

  const progressPercentage =
    initialSessionQuestionCount > 0
      ? (Math.min(
          questionsAttemptedThisSessionCount,
          initialSessionQuestionCount
        ) /
          initialSessionQuestionCount) *
        100
      : 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 bg-dark-secondary shadow-2xl rounded-lg text-white">
      {isLoadingNextQuestion && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 sm:p-8 text-center rounded-lg transition-opacity duration-300 ease-in-out">
          <div className="bg-dark-secondary p-6 sm:p-10 rounded-xl shadow-xl transform transition-all duration-300 ease-out scale-100 animate-fadeIn">
            <div className="mb-6">
              {countdown > 0 ? (
                <span className="text-7xl sm:text-8xl font-bold text-dark-accent drop-shadow-lg">
                  {countdown}
                </span>
              ) : (
                <span className="text-5xl sm:text-6xl font-bold text-green-400 drop-shadow-lg">
                  Ready!
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl text-slate-300 mb-5 font-medium">
              get ready for the next question...
            </p>

            {pointsFromLastQuestion !== null && pointsFromLastQuestion > 0 && (
              <div className="my-5 text-center">
                <p className="text-2xl font-semibold text-green-400 animate-pulse">
                  +{pointsFromLastQuestion} Poin!
                </p>
              </div>
            )}
            {pointsFromLastQuestion !== null &&
              pointsFromLastQuestion === 0 && (
                <div className="my-5 text-center">
                  <p className="text-xl font-semibold text-yellow-500">
                    No additional points.
                  </p>
                </div>
              )}

            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden mt-6 shadow-inner">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${
                    ((INTERSTITIAL_COUNTDOWN_SECONDS -
                      Math.max(0, countdown > 0 ? countdown - 1 : 0)) /
                      INTERSTITIAL_COUNTDOWN_SECONDS) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {!isLoadingNextQuestion && currentQuestion && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
              <span>
                Question{" "}
                {Math.min(
                  questionsAttemptedThisSessionCount + 1,
                  initialSessionQuestionCount
                )}{" "}
                of {initialSessionQuestionCount}
              </span>
              {!showFeedback && (
                <div className="text-dark-accent font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 bg-dark-accent text-white">
                  {timeLeft}s
                </div>
              )}
              <span className="font-semibold text-lg text-dark-accent">
                Score: {score}
              </span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
              <div
                className="bg-dark-accent h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-6 min-h-[100px] flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-center text-slate-100">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              let buttonClass =
                "w-full p-4 rounded-lg transition-all duration-200 ease-in-out text-lg font-medium border-2 focus:outline-none focus:ring-4";
              if (showFeedback) {
                if (option === currentQuestion.correctAnswer) {
                  buttonClass +=
                    " bg-green-500 border-green-600 text-white ring-green-400/50 transform scale-105 shadow-lg";
                } else if (
                  option === selectedAnswer &&
                  option !== currentQuestion.correctAnswer
                ) {
                  buttonClass +=
                    " bg-red-500 border-red-600 text-white ring-red-400/50 transform scale-105 shadow-lg";
                } else {
                  buttonClass +=
                    " bg-slate-700 border-slate-600 text-slate-400 opacity-60 cursor-not-allowed";
                }
              } else {
                buttonClass +=
                  " bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-dark-accent text-slate-200 focus:ring-dark-accent/50";
              }
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={
                    selectedAnswer !== null ||
                    timeLeft === 0 || 
                    showFeedback ||
                    isLoadingNextQuestion
                  }
                  className={buttonClass}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showFeedback &&
            answeredCorrectly !== null &&
            !isLoadingNextQuestion && ( 
              <div
                className={`mt-8 p-4 rounded-md text-center text-xl font-semibold text-white shadow-lg ${
                  timeLeft === 0 && !selectedAnswer
                    ? "bg-yellow-600"
                    : answeredCorrectly
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {timeLeft === 0 && !selectedAnswer
                  ? "Out of time!"
                  : answeredCorrectly
                  ? "Nice! That's correct!"
                  : "Oops! Wrong answer."}
              </div>
            )}
        </>
      )}
    </div>
  );
}
