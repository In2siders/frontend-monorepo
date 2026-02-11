import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Tailwind CSS
import '@repo/tailwind-config';
import { AuthProvider } from './providers/AuthProvider.js';

// Use React.createElement to avoid relying on JSX transform helpers
const root = createRoot(document.getElementById('root'))
root.render(
  React.createElement(AuthProvider, null, React.createElement(App, null))
)
