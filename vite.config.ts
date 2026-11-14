import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// The site's address and the repository's live in package.json only. Vite also fills %VITE_SITE_URL% in index.html from these defines.
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
  homepage: string
  repository: { url: string }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(pkg.homepage),
    'import.meta.env.VITE_SOURCE_URL': JSON.stringify(pkg.repository.url.replace(/\.git$/, '')),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
