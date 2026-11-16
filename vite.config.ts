import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp}'] },
      manifest: {
        name: 'Minhas Milhas',
        short_name: 'Minhas Milhas',
        description: 'Controle de pontos e milhas e do valor do milheiro',
        lang: 'pt-BR',
        theme_color: '#0b7a75',
        background_color: '#0e161d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
})
