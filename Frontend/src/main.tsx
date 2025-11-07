import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary';
import logger from './utils/logger';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker only in web production builds (not in Capacitor/mobile apps)
const isCapacitor = !!(window as any).Capacitor;
if (import.meta.env.PROD && !isCapacitor && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        logger.info('Service worker registered.', reg);
      })
      .catch((err) => {
        logger.warn('Service worker registration failed:', err);
      });
  });
}
