import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './club.css';
import App from './App.tsx';
import { inClaude } from './lib/runtime';
import { local } from './lib/store';
import { startAutoSync } from './lib/sync';
import { applyTheme } from './pages/Settings';

// Inside claude.ai the viewer owns the theme attribute and the page frame.
if (inClaude) document.documentElement.classList.add('in-claude');
else applyTheme((local.get('nd.theme') as 'system' | 'light' | 'dark') || 'system');
startAutoSync();

if (!inClaude && 'serviceWorker' in navigator && import.meta.env.PROD) {
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
