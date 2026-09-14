import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined)
    } else {
      // В разработке service worker мешает HMR и оставляет старые модули.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister())
      }).catch(() => undefined)
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
