import Link from "next/link";
import Image from "next/image";
import { CustomWalletConnectButton } from "@/components/WalletConnect";

const Navbar = () => {
  return (
    <header className="w-full absolute top-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between p-4 sm:p-6">
        {/* Logo kiri */}
        <Link href="/" legacyBehavior>
          <a className="flex items-center text-dark-accent hover:text-dark-accent-hover hidden sm:block">
            <Image
              src="/funquiz.png"
              alt="Somnia Quiz Logo"
              width={80}
              height={80}
              priority
            />
          </a>
        </Link>
        <div className="flex gap-6 items-center justify-center flex-1 sm:ml-8">
          <Link href="/leaderboard" legacyBehavior>
            <a className="text-sm sm:text-xl font-bold text-dark-accent hover:text-dark-accenthover transition-all duration-200 ease-out transform hover:scale-95">
              Leaderboard
            </a>
          </Link>
          <Link href="/create-quiz" legacyBehavior>
            <a className="text-sm sm:text-xl font-bold text-dark-accent hover:text-dark-accenthover transition-all duration-200 ease-out transform hover:scale-95">
              Create Quiz
            </a>
          </Link>
        </div>

        <div className="flex items-center text-sm sm:text-base">
          <div className="transition-all duration-200 ease-out transform hover:scale-95 text-dark-accent hover:text-dark-accenthover">
            <CustomWalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
