import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import remarkGfm from 'remark-gfm';

// https://vite.dev/config/
export default async ({ mode }) => {
  const mdx = await import('@mdx-js/rollup');
  const remarkFrontmatter = (await import('remark-frontmatter')).default;
  const remarkMdxFrontmatter = (await import('remark-mdx-frontmatter')).default;

  // load env variables (VITE_ prefixed) for the current mode
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '')

  const port = env.VITE_PORT || process.env.VITE_PORT || 3000
  const host = env.VITE_HOST || process.env.VITE_HOST || '0.0.0.0'

  return defineConfig({
    plugins: [
      react(),
      mdx.default({
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
          remarkGfm,
        ],
      }),
    ],
    server: {
      // NO ESTAMOS EN PRODUCION ASI QUE TEN PIEDAD
      allowedHosts: ["in2siders.app", "localhost", "127.0.0.1"],
      port: Number(port),
      host,
      open: true,
      strictPort: true,
    },
    appType: 'spa',
  })
}
