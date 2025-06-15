import Link from 'next/link'; // Gunakan Link dari Next.js jika Anda memakainya

const Footer = () => {
  const usefulLinks = [
    { name: 'Home', href: '/' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Create Quiz', href: '/create-quiz' },
  ];

  const moreDapps = [
    { name: 'AuctSom', href: 'https://auctsom.vercel.app' },
    { name: 'FunQuiz', href: 'https://funquiz.vercel.app/' },
    { name: 'FunMint', href: 'https://funmint.vercel.app/' },
    { name: 'YourBeFun', href: 'https://yourbefun.vercel.app/' },
    { name: 'Somcet', href: 'https://somcet.vercel.app/' },
    { name: 'gSomnia Clicks', href: 'https://gsomnia-clicks.vercel.app/' },
  ];

  return (
    <footer className="w-full text-white p-8 md:p-12 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-dark-accent">FunQuiz</h3>
            <p className="italic text-dark-text-secondary">
              “Knowledge is power, play and learn!”
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold uppercase tracking-wider text-dark-accent">Useful Links</h4>
            <ul className="space-y-2 text-dark-text-secondary">
              {usefulLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-yellow-400 transition-colors duration-300">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold uppercase tracking-wider text-dark-accent">More dApps</h4>
            <ul className="space-y-2 text-dark-text-secondary">
              {moreDapps.map((dapp) => (
                <li key={dapp.name}>
                  <a href={dapp.href} className="hover:text-yellow-400 transition-colors duration-300">
                    {dapp.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <hr className="border-gray-700 my-6" />
        <div className="text-center text-sm text-dark-text-secondary">
          <small>
            Built with <span className="text-yellow-400">💛</span> by Somnia Community
          </small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;