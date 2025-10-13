import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Tailwind CSS
import '@repo/tailwind-config';

createRoot(document.getElementById('root')).render(
  <App />,
)
