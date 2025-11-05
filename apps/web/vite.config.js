import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default ({ mode }) => {
  // load env variables (VITE_ prefixed) for the current mode
  const env = loadEnv(mode, process.cwd(), '')

  const port = env.VITE_PORT || process.env.VITE_PORT || 3000
  const host = env.VITE_HOST || process.env.VITE_HOST || '0.0.0.0'

  return defineConfig({
    plugins: [react()],
    server: {
      allowedHosts: ["exclusive-internal-web.leiuq.fun"],
      port: Number(port),
      host,
      open: true,
      strictPort: true,
    },
    appType: 'spa',
  })
}
