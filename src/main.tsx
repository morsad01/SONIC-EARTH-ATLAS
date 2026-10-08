import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './space-background.css'
import './space-background.js'
import App from './App.tsx'
import { PrefsProvider } from './lib/prefs'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <App />
    </PrefsProvider>
  </StrictMode>,
)
