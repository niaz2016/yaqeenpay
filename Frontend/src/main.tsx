import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import debug utilities in development mode
if (import.meta.env.MODE === 'development') {
  import('./debug/tokenDebug');
  import('./debug/tokenRefresher');
  console.log('🔧 Debug utilities loaded - Available in console: debugTokens(), refreshAuthToken(), manualLogin(), getProfile()');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
