import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default ({ mode }) => {
  // load env variables (VITE_ prefixed) for the current mode
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '')

  const port = env.VITE_PORT || process.env.VITE_PORT || 3000
  const host = env.VITE_HOST || process.env.VITE_HOST || '0.0.0.0'

  return defineConfig({
    plugins: [react()],
    server: {
      allowedHosts: ["in2siders.app"],
      port: Number(port),
      host,
      open: true,
      strictPort: true,
    },
    appType: 'spa',
  })
}
