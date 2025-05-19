import Link from 'next/link';
import Image from 'next/image';
import { CustomWalletConnectButton } from '@/components/WalletConnect';

const Navbar = () => {
  return (
    <header className="w-full absolute top-0">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between p-4 sm:p-6">
        {/* kiri: logo */}
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

        {/* kanan: leaderboard + wallet */}
        <div className="flex items-center gap-6">
          <Link href="/leaderboard" legacyBehavior>
            <a className="text-xl font-bold text-dark-accent hover:text-dark-accent-hover transition">
              Leaderboard
            </a>
          </Link>
          <CustomWalletConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
