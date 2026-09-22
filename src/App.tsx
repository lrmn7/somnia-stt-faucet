import React from 'react';
import { Toaster } from 'sonner';
import { Navbar } from './components/faucet/Navbar';
import { FaucetForm } from './components/faucet/FaucetForm';
import { GlobalBackground } from './components/faucet/GlobalBackground';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-between relative text-white bg-transparent selection:bg-somnia-700 selection:text-white overflow-x-hidden">
      <GlobalBackground videoSrc="/bg.mp4" overlayOpacity={30} />
      <div className="relative z-20">
        <Navbar />
      </div>
      <main className="flex-1 flex items-center justify-center py-6 sm:py-12 relative z-10">
        <FaucetForm />
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0c0c0c',
            border: '1px solid #242424',
            color: '#ffffff',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontSize: '13px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.85)',
          },
        }}
      />
    </div>
  );
};

export default App;
