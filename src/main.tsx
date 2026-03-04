import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Disable right-click globally
window.addEventListener('contextmenu', (e) => e.preventDefault());

console.log('main.tsx: starting createRoot');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
console.log('main.tsx: render called');
