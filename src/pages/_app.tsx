import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from 'react-hot-toast';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'bg-dark-secondary text-dark-text border border-dark-accent',
          style: {
            background: '#1A1A1A',
            color: '#E0E0E0',
            border: '1px solid #F2AC29'
          },
          success: {
            iconTheme: {
              primary: '#F2AC29',
              secondary: '#0D0D0D',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4B4B',
              secondary: '#0D0D0D',
            },
          },
        }}
      />
    </ThirdwebProvider>
  );
}

export default MyApp;