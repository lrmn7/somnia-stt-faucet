import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if (typeof window !== 'undefined') {
  console.log(
    '%c⚠️ Security Notice',
    "font-size:18px;font-weight:bold;color:#FACC15;font-family:'Segoe UI',system-ui,sans-serif"
  );
  console.log(
    "%c Pasting unknown code or scripts into the developer console can compromise your wallet security.\n Never paste private keys, seed phrases, or unverified scripts here.\n Developers only beyond this point.",
    "font-size:12px;color:#F87171;font-family:'Segoe UI Mono',Consolas,monospace;line-height:1.6"
  );
  console.log(' ');
  console.log(
    '%c💻 GitHub Repository → %chttps://github.com/lrmn7/somnia-stt-faucet',
    "font-size:12px;color:#A78BFA;font-family:'Segoe UI',sans-serif",
    "font-size:12px;color:#60A5FA;text-decoration:underline;font-family:'Segoe UI',sans-serif"
  );
  console.log(' ');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
