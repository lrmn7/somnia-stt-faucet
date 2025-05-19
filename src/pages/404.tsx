import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";

export default function PageNotFound() {
  return (
    <MainLayout pageTitle="404 - Page Not Found">
      <h1 className="text-4xl sm:text-6xl font-bold text-dark-accent mb-6">
        Whoops! Lost in Space?
      </h1>

      <p className="text-lg text-dark-text-secondary mb-6">
        The page you're looking for isn't found :(
We suggest you back to home
      </p>

      <div className="w-full max-w-sm mx-auto mb-8">
        <Image
          src="/rickroll.gif" // Ganti ke .png kalau kamu pakai PNG
          alt="404 Not Found"
          width={600}
          height={400}
          className="rounded-xl"
        />
      </div>

      <Link href="/" legacyBehavior>
        <a className="px-6 py-2 bg-dark-accent text-dark-primary rounded-lg font-semibold hover:bg-opacity-80 transition">
          Back to Home
        </a>
      </Link>
    </MainLayout>
  );
}
