import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-transparent backdrop-blur-[2px] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-2 select-none">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tighter leading-none">
            &#123;F&#125;
          </span>
          <span className="text-xs sm:text-sm font-medium tracking-wide text-somnia-300">
            Faucet
          </span>
        </div>
        <div className="flex items-center gap-5 sm:gap-6 text-xs sm:text-sm text-somnia-300">
          <a
            href="https://somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-150 py-1 font-medium select-none"
            aria-label="Visit official Somnia Network website"
          >
            <span className="font-mono text-white font-bold">&#123;S&#125;</span>omnia Network
          </a>

          <a
            href="https://x.com/Somnia_Network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-somnia-400 hover:text-white transition-colors duration-150 p-1.5 rounded-md hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-white"
            aria-label="Somnia Network on X"
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
