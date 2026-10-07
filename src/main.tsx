import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { local } from './lib/store';
import { startAutoSync } from './lib/sync';
import { applyTheme } from './pages/Settings';

applyTheme((local.get('nd.theme') as 'system' | 'light' | 'dark') || 'system');
startAutoSync();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is optional */
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
