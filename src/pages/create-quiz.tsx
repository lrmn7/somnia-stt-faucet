import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

const CreateQuizPage: NextPage = () => {
  return (
    <MainLayout
      pageTitle="Create Quiz - Coming Soon"
      pageDescription="Create your own Somnia quiz and challenge your friends!"
    >
      <h1 className="text-4xl md:text-6xl font-bold text-dark-accent mb-6">
        Create Your Quiz
      </h1>

      <p className="text-xl text-dark-text-secondary mb-6">
        🚧 Coming Soon... Get ready to build your own FUN QUIZ adventure!
      </p>

      <div className="w-full max-w-sm mx-auto">
        <Image
          src="/rickroll.gif"
          alt="Coming Soon Illustration"
          width={600}
          height={400}
          className="rounded-xl"
        />
      </div>
            <Link href="/" legacyBehavior>
        <a className="mt-8 px-6 py-2 bg-dark-accent text-dark-primary font-semibold rounded-lg hover:bg-opacity-80 transition-colors">
          Back to Home
        </a>
      </Link>
    </MainLayout>
  );
};

export default CreateQuizPage;
