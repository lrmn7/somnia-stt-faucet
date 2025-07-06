import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
export interface ScoreEntry {
  address: string;
  score: number;
  questionsCorrect: number;
  questionsAttempted: number;
  timestamp: string;
  _id?: string;
}

interface LeaderboardProps {
  topScores: ScoreEntry[];
  error: string | null;
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const LeaderboardPage: NextPage<LeaderboardProps> = ({ topScores, error }) => {
  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <MainLayout
      pageTitle="Leaderboard - Somnia Legends"
      pageDescription="Embark On Your Somnia Journey!"
    >
      <h1 className="text-4xl md:text-6xl font-bold text-dark-accent mb-6">
        Somnia Legends
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-800 text-white rounded">
          <p>Error loading leaderboard: {error}</p>
          <p>Please check the API endpoint and database connection.</p>
        </div>
      )}

      {!error && topScores.length > 0 ? (
        <div className="w-full max-w-2xl bg-dark-secondary shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-dark-tertiary">
                <tr>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 text-center align-middle text-xs sm:text-xs font-medium text-dark-accent uppercase tracking-wider break-words">
                    Rank
                  </th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 text-center align-middle text-xs sm:text-xs font-medium text-dark-accent uppercase tracking-wider break-words">
                    Player
                  </th>
                  <th className="px-2 py-2 sm:px-6 sm:py-3 text-center align-middle text-xs sm:text-xs font-medium text-dark-accent uppercase tracking-wider break-words">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {topScores.map((entry, index) => (
                  <tr
                    key={entry._id || entry.address + entry.timestamp}
                    className="hover:bg-dark-hover"
                  >
                    <td className="px-2 py-2 sm:px-6 sm:py-4 text-sm sm:text-base font-bold text-center align-middle break-words">
                      {index + 1}
                    </td>
                    <td
                      className="px-2 py-2 sm:px-6 sm:py-4 text-sm sm:text-base font-bold text-center align-middle break-words"
                      title={entry.address}
                    >
                      {truncateAddress(entry.address)}
                    </td>
                    <td className="px-2 py-2 sm:px-6 sm:py-4 text-sm sm:text-base font-bold text-dark-accent text-center align-middle break-words">
                      {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <p className="text-xl text-dark-text-secondary">
            No results yet. Start your journey now!
          </p>
        )
      )}

      <Link href="/" legacyBehavior>
        <a className="mt-8 px-6 py-2 bg-dark-accent text-dark-primary font-semibold rounded-lg hover:bg-opacity-80 transition-colors">
          Back to Home
        </a>
      </Link>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps<
  LeaderboardProps
> = async () => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${apiBaseUrl}/api/get-leaderboard`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Failed to fetch leaderboard API:",
        response.status,
        errorData
      );
      return {
        props: {
          topScores: [],
          error:
            errorData.message ||
            `Failed to fetch data: Status ${response.status}`,
        },
      };
    }

    const topScores: ScoreEntry[] = await response.json();

    return {
      props: {
        topScores,
        error: null,
      },
    };
  } catch (error: any) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        topScores: [],
        error: error.message || "An unexpected error occurred.",
      },
    };
  }
};

export default LeaderboardPage;
