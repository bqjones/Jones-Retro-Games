import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />,
)

// Offline cache (production only): one online visit downloads the emulator and
// every game, so flaky cabin internet can't interrupt gameplay.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline caching is a nice-to-have; the site works without it.
    })
  })
}
