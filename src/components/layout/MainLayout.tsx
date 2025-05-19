// file: MainLayout.tsx

import Head from "next/head";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Loader from "@/components/Loader";
import SocialLinks from "@/components/SocialLinks";

interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageImage?: string;
  pageUrl?: string;
}

const MainLayout = ({
  children,
  pageTitle = "Fun Quiz",
  pageDescription = "Ready to test what you know about the Somnia Network?",
  pageImage = "/og.png",
  pageUrl = "https://fun-quiz.vercel.app",
}: MainLayoutProps) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isLeaderboardMobile = router.pathname === "/leaderboard" && isMobile;

  return (
    <div className="min-h-screen bg-dark-primary text-dark-text flex flex-col items-center selection:bg-dark-accent selection:text-dark-primary">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:url" content={`${pageUrl}${router.asPath}`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
      </Head>

      <Loader>FUN QUIZ</Loader>
      <Navbar />
      {!isLeaderboardMobile && <SocialLinks />}
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 md:px-20 text-center pt-20 pb-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
