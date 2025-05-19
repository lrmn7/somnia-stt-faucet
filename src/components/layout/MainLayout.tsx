import Head from "next/head";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ReactNode } from "react";
import Loader from "@/components/Loader";
import SocialLinks from "@/components/SocialLinks";
interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

const MainLayout = ({
  children,
  pageTitle = "Fun Quiz",
  pageDescription = "Ready to test what you know about the Somnia Network?",
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-dark-primary text-dark-text flex flex-col items-center selection:bg-dark-accent selection:text-dark-primary">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Loader>FUN QUIZ</Loader>
      <Navbar />
      <SocialLinks />
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 md:px-20 text-center pt-20 pb-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
