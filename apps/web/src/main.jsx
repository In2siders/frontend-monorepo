import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Tailwind CSS
import '@repo/tailwind-config';

// Use React.createElement to avoid relying on JSX transform helpers
const root = createRoot(document.getElementById('root'))
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App, null))
)
